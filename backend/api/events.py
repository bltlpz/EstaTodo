from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from api.stream import handle_event, _to_ws_payload
from db.database import async_session_maker
from db.models import Event
from blockchain.avalanche_client import avalanche_client

import logging
logger = logging.getLogger(__name__)


class DisputeResponse(BaseModel):
    event_id: str
    hash_sha256: str | None
    blockchain_tx: str | None
    vision_verdict: str
    genlayer_verdict: str  # alias de compatibilidad
    dispute_status: str
    incident_description: str | None = None
    ipfs_cid: str | None = None
    ipfs_url: str | None = None


class EventIngest(BaseModel):
    type: str
    camera_id: str
    timestamp: datetime
    clip_path: str | None = None
    hash_sha256: str | None = None
    confidence: float = 0.0
    metadata: dict[str, Any] = Field(default_factory=dict)
    module: str = "CARGO"
    incident_description: str | None = None


router = APIRouter()


@router.post("/ingest")
async def ingest_event(body: EventIngest) -> dict[str, Any]:
    payload = body.model_dump()
    ev = await handle_event(payload, extract_key_frames=True)
    return {
        "id": ev.id,
        "hash_sha256": ev.hash_sha256,
        "ipfs_cid": ev.ipfs_cid,
        "ipfs_url": ev.ipfs_url,
        "key_frames": (ev.event_metadata or {}).get("key_frames", []),
    }


@router.get("/")
async def list_events() -> list[dict[str, Any]]:
    async with async_session_maker() as session:
        result = await session.execute(select(Event).order_by(Event.timestamp.desc()).limit(100))
        events = result.scalars().all()
        logger.info(f"[INFO] Consultando eventos, total={len(events)}")
        return [_to_ws_payload(ev) for ev in events]


@router.get("/{event_id}")
async def get_event(event_id: str) -> dict[str, Any]:
    async with async_session_maker() as session:
        result = await session.execute(select(Event).where(Event.id == event_id))
        ev = result.scalar_one_or_none()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")
        return _to_ws_payload(ev)


@router.get("/{event_id}/verify")
async def verify_event_endpoint(event_id: str) -> dict[str, Any]:
    async with async_session_maker() as session:
        result = await session.execute(select(Event).where(Event.id == event_id))
        ev = result.scalar_one_or_none()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")

        verified = False
        if ev.hash_sha256:
            verified = await avalanche_client.verify_hash(ev.hash_sha256)

        return {
            "event_id": str(ev.id),
            "hash_sha256": str(ev.hash_sha256),
            "blockchain_tx": str(ev.blockchain_tx) if ev.blockchain_tx else None,
            "verified": verified,
            "blockchain_status": str(ev.blockchain_status) if ev.blockchain_status else None,
        }


@router.post("/{event_id}/dispute", response_model=DisputeResponse)
async def create_dispute(event_id: str) -> DisputeResponse:
    logger.info(f"[INFO] Iniciando disputa para evento {event_id}")

    async with async_session_maker() as session:
        result = await session.execute(select(Event).where(Event.id == event_id))
        ev = result.scalar_one_or_none()
        if not ev:
            raise HTTPException(status_code=404, detail="Event not found")

        if not ev.hash_sha256:
            raise HTTPException(status_code=400, detail="Event missing hash — cannot dispute")

        # Use stored incident_description or generate a descriptive fallback
        description = ev.incident_description
        if not description:
            ts_str = ev.timestamp.strftime("%Y-%m-%d %H:%M") if ev.timestamp else "desconocido"
            description = (
                f"Se detectó un evento de tipo {ev.type} en la cámara {ev.camera_id}. "
                f"El sistema de visión artificial identificó la amenaza con una confianza del "
                f"{(ev.confidence or 0) * 100:.0f}%. "
                f"El evento ocurrió el {ts_str} durante un viaje en curso. "
                f"Nivel de riesgo estimado: {'ALTO' if (ev.confidence or 0) > 0.7 else 'MEDIO'}."
            )

        # Obtener key frames guardados en metadata (generados al ingestar el clip)
        key_frames: list[str] = (ev.event_metadata or {}).get("key_frames", [])

        from integrations.claude_vision_client import claude_vision_client
        logger.info("[INFO] Enviando frames a Claude Vision para análisis...")

        result = await claude_vision_client.analyze_frames(
            frame_paths=key_frames,
            event_type=ev.type,
        )

        verdict = result.get("verdict", "REQUIERE_REVISION")
        description = result.get("description", "")
        logger.info(f"[INFO] Veredicto Claude Vision: {verdict}")

        ev.genlayer_verdict = verdict          # columna DB reutilizada
        ev.incident_description = description  # descripción generada por Claude
        session.add(ev)
        await session.commit()
        await session.refresh(ev)

        return DisputeResponse(
            event_id=str(ev.id),
            hash_sha256=str(ev.hash_sha256),
            blockchain_tx=str(ev.blockchain_tx) if ev.blockchain_tx else None,
            vision_verdict=verdict,
            genlayer_verdict=verdict,  # alias de compatibilidad con el frontend
            dispute_status="resolved",
            incident_description=description,
            ipfs_cid=ev.ipfs_cid,
            ipfs_url=ev.ipfs_url,
        )


@router.get("/cameras/{camera_id}/stream")
async def camera_stream_placeholder(camera_id: str):
    """"Placeholder — MJPEG stream will be implemented when cameras are connected."""
    raise HTTPException(
        status_code=404,
        detail=f"Stream no disponible para {camera_id} — cámara fuera de cobertura",
    )


@router.post("/demo/seed")
async def seed_demo_endpoint() -> dict[str, Any]:
    import hashlib
    from datetime import timedelta
    from db.models import BlockchainStatus

    demo_events = [
        Event(
            id="demo-robo-001",
            type="FALL",
            camera_id="CAM-TRK-01",
            timestamp=datetime.utcnow() - timedelta(hours=2),
            hash_sha256=hashlib.sha256(b"demo-robo-001").hexdigest(),
            blockchain_tx="0x" + "a3f8b2c1d4e5f6789012345678901234567890ab",
            blockchain_status=BlockchainStatus.CONFIRMED,
            genlayer_verdict="CONFIRMADO",
            incident_description="Operario detectado manipulando pallets sin autorización dentro del trailer. Movimiento sospechoso hacia la salida trasera. Confianza: 89%.",
            module="CARGO",
            ipfs_cid="QmQdEmYyzTSx7akqhKAjhQKYpzoCicg682LWMF5U4f4Vnw",
            ipfs_url="https://gateway.pinata.cloud/ipfs/QmQdEmYyzTSx7akqhKAjhQKYpzoCicg682LWMF5U4f4Vnw",
        ),
        Event(
            id="demo-normal-002",
            type="FALL",
            camera_id="CAM-TRK-02",
            timestamp=datetime.utcnow() - timedelta(hours=1),
            hash_sha256=hashlib.sha256(b"demo-normal-002").hexdigest(),
            blockchain_tx="0x" + "b4c9d3e2f1a0789012345678901234567890cd",
            blockchain_status=BlockchainStatus.CONFIRMED,
            genlayer_verdict="FALSA_ALARMA",
            incident_description="Operario realizando revisión autorizada de inventario. Sin irregularidades.",
            module="CARGO",
            ipfs_cid="Qmd64GPr5qub8nJsZwu6nshLiecGD55xjUj5J7L5u6NW9A",
            ipfs_url="https://gateway.pinata.cloud/ipfs/Qmd64GPr5qub8nJsZwu6nshLiecGD55xjUj5J7L5u6NW9A",
        ),
        Event(
            id="demo-inconcluso-003",
            type="FALL",
            camera_id="CAM-TRK-03",
            timestamp=datetime.utcnow() - timedelta(minutes=30),
            hash_sha256=hashlib.sha256(b"demo-inconcluso-003").hexdigest(),
            blockchain_tx="0x" + "c5d0e4f3a2b1789012345678901234567890ef",
            blockchain_status=BlockchainStatus.CONFIRMED,
            genlayer_verdict=None,
            incident_description="Movimiento detectado en zona de carga. Iluminación insuficiente para análisis definitivo.",
            module="CARGO",
            ipfs_cid="QmZ493qkBKZF6iB1znAhdCxxhxnm8aJMvBnputwHeJVhaU",
            ipfs_url="https://gateway.pinata.cloud/ipfs/QmZ493qkBKZF6iB1znAhdCxxhxnm8aJMvBnputwHeJVhaU",
        ),
    ]

    async with async_session_maker() as session:
        from sqlalchemy import text
        # Fix: Delete all existing events first for a clean demo state
        await session.execute(text("DELETE FROM events"))
        
        for event in demo_events:
            session.add(event)
        await session.commit()

    return {"status": "success", "message": "3 demo events seeded (DB cleaned)", "count": 3}

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.config import settings
from db.database import async_session_maker
from db.models import Event, BlockchainStatus

logger = logging.getLogger(__name__)
router = APIRouter()

connected_clients: set[WebSocket] = set()
event_queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=1000)
_broadcast_task: Optional[asyncio.Task[None]] = None


@router.websocket("")
async def ws_stream(ws: WebSocket) -> None:
    await ws.accept()
    connected_clients.add(ws)
    try:
        # Esperar mensajes del cliente para detectar desconexión.
        # (Los eventos se empujan desde `_broadcast_loop`.)
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        connected_clients.discard(ws)
    except Exception:
        connected_clients.discard(ws)


async def _broadcast_loop() -> None:
    while True:
        event = await event_queue.get()
        if not connected_clients:
            continue

        stale: list[WebSocket] = []
        for ws in connected_clients:
            try:
                await ws.send_json(event)
            except Exception:
                stale.append(ws)

        for ws in stale:
            connected_clients.discard(ws)


def _to_ws_payload(db_event: Event) -> dict[str, Any]:
    ts: Optional[datetime] = db_event.timestamp
    return {
        "id": db_event.id,
        "type": db_event.type,
        "camera_id": db_event.camera_id,
        "timestamp": ts.isoformat() if ts else None,
        "clip_path": db_event.clip_path,
        "hash_sha256": db_event.hash_sha256,
        "blockchain_tx": db_event.blockchain_tx,
        "blockchain_status": str(db_event.blockchain_status)
        if db_event.blockchain_status is not None
        else BlockchainStatus.PENDING.value,
        "confidence": db_event.confidence,
        "metadata": db_event.event_metadata or {},
        "module": db_event.module or "CARGO",
        # genlayer_verdict se reutiliza en DB pero se expone como vision_verdict
        "vision_verdict": db_event.genlayer_verdict,
        "genlayer_verdict": db_event.genlayer_verdict,  # alias de compatibilidad
        "incident_description": db_event.incident_description,
        "ipfs_cid": db_event.ipfs_cid,
        "ipfs_url": db_event.ipfs_url,
    }


async def handle_event(
    event_payload: dict[str, Any],
    *,
    extract_key_frames: bool = False,
) -> Event:
    """
    Persistir evento en DB y enviarlo al broadcast queue.
    Si extract_key_frames=True y hay clip_path, extrae key frames y los guarda en metadata.
    Retorna el evento creado.
    """
    ts = event_payload.get("timestamp")
    if isinstance(ts, str):
        from datetime import datetime as dt
        ts = dt.fromisoformat(ts.replace("Z", "+00:00"))
    if not isinstance(ts, datetime):
        raise ValueError("handle_event: se esperaba timestamp datetime o ISO string")

    async with async_session_maker() as session:
        ev = Event(
            type=event_payload["type"],
            camera_id=event_payload["camera_id"],
            timestamp=ts,
            clip_path=event_payload.get("clip_path"),
            hash_sha256=event_payload.get("hash_sha256"),
            confidence=float(event_payload.get("confidence", 0.0)),
            event_metadata=dict(event_payload.get("metadata") or {}),
            module=event_payload.get("module") or "CARGO",
            genlayer_verdict=event_payload.get("genlayer_verdict"),
            incident_description=event_payload.get("incident_description"),
        )
        session.add(ev)
        await session.commit()
        await session.refresh(ev)
        
        import logging
        logging.getLogger(__name__).info(f"[INFO] Evento guardado en DB: id={ev.id}")

        if extract_key_frames and ev.clip_path:
            from vision.clip_extractor import extract_key_frames as ex
            paths = ex(ev.clip_path, ev.id)
            if paths:
                ev.event_metadata = {**(ev.event_metadata or {}), "key_frames": paths}
                session.add(ev)
                await session.commit()
                await session.refresh(ev)

        # ── IPFS upload (only if clip exists and Pinata is configured) ──────────
        ipfs_cid = ""
        ipfs_url = ""
        if ev.clip_path:
            try:
                from integrations.ipfs_client import pinata_client
                if pinata_client.is_configured():
                    logger.info(f"[INFO] Subiendo clip a IPFS: {ev.clip_path}")
                    cid = await pinata_client.upload_file(ev.clip_path)
                    ipfs_url_result = f"https://gateway.pinata.cloud/ipfs/{cid}"
                    logger.info(f"[INFO] IPFS CID: {cid}")
                    logger.info(f"[INFO] URL pública: {ipfs_url_result}")
                    ipfs_cid = cid
                    ipfs_url = ipfs_url_result
                    ev.ipfs_cid = cid
                    ev.ipfs_url = ipfs_url_result
                    ev.event_metadata = {**(ev.event_metadata or {}), "ipfs_cid": cid, "ipfs_url": ipfs_url_result}
                    session.add(ev)
                    await session.commit()
                    await session.refresh(ev)
                else:
                    logger.warning("[WARNING] IPFS no configurado, video solo en storage local")
            except Exception as e:
                logger.error(f"[ERROR] Fallo al subir a IPFS: {e}")

        # ── Avalanche L1 registration ────────────────────────────────────────────
        from blockchain.avalanche_client import avalanche_client

        if getattr(settings, "BLOCKCHAIN_ENABLED", False) and avalanche_client.is_connected() and ev.hash_sha256:
            try:
                tx_hash = await avalanche_client.register_event(
                    event_id=str(ev.id),
                    camera_id=str(ev.camera_id),
                    timestamp=ev.timestamp.isoformat() if ev.timestamp else "",
                    hash_sha256=str(ev.hash_sha256),
                    event_type=str(ev.type),
                    ipfs_cid=ipfs_cid,
                    description=ev.incident_description or "",
                )
                ev.blockchain_tx = tx_hash
                ev.blockchain_status = "confirmed"
                session.add(ev)
                await session.commit()
                await session.refresh(ev)
                logger.info(f"[INFO] Registrando en Avalanche: hash + CID={ipfs_cid[:12] if ipfs_cid else 'sin IPFS'}...")
                logger.info(f"[INFO] TX confirmada: {tx_hash}")
            except Exception as e:
                logger.error(f"Error registering event on Avalanche: {e}")
                ev.blockchain_status = "failed"
                session.add(ev)
                await session.commit()
                await session.refresh(ev)

        await event_queue.put(_to_ws_payload(ev))
    return ev


def start_broadcast_task() -> None:
    """Inicia el task de broadcast. Llamar desde lifespan."""
    global _broadcast_task
    if _broadcast_task is None:
        _broadcast_task = asyncio.create_task(_broadcast_loop())

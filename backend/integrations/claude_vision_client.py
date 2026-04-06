"""
Cliente de Claude Vision para análisis de incidentes de seguridad.

Reemplaza a GenLayer como capa de verificación de eventos.
Analiza key frames del clip detectado y devuelve:
  - verdict: CONFIRMADO | FALSA_ALARMA | REQUIERE_REVISION
  - description: descripción textual generada por Claude

Si ANTHROPIC_API_KEY no está configurada, corre en modo mock
determinístico (igual comportamiento que el mock de GenLayer anterior).
"""
from __future__ import annotations

import asyncio
import base64
import logging
from pathlib import Path

from core.config import settings

logger = logging.getLogger(__name__)

# ── Veredictos válidos ────────────────────────────────────────────────────────
VERDICT_CONFIRMADO = "CONFIRMADO"
VERDICT_FALSA_ALARMA = "FALSA_ALARMA"
VERDICT_REQUIERE_REVISION = "REQUIERE_REVISION"
VALID_VERDICTS = {VERDICT_CONFIRMADO, VERDICT_FALSA_ALARMA, VERDICT_REQUIERE_REVISION}

# Mapa de tipo de evento → etiqueta en español para el prompt
_EVENT_LABEL = {
    "FALL": "caída de operario",
    "NO_HELMET": "operario sin casco",
    "NO_VEST": "operario sin chaleco reflectivo",
    "UNAUTHORIZED_ACCESS": "acceso no autorizado de vehículo",
    "ROBO": "posible robo de carga",
    "MANIPULACION_CARGA": "manipulación de carga",
    "APERTURA_NO_AUTORIZADA": "apertura no autorizada del trailer",
}

_SYSTEM_PROMPT = """
Sos un sistema de inteligencia artificial especializado en seguridad laboral y logística de carga en Argentina.
Tu tarea es analizar imágenes de cámaras de seguridad (frames extraídos de un clip de video) y determinar si un incidente detectado automáticamente es real o no.

Reglas:
1. Analizá todos los frames provistos en orden cronológico.
2. Respondé siempre en español rioplatense, de forma técnica y concisa.
3. Tu respuesta DEBE contener exactamente este formato JSON (sin markdown, sin texto extra):

{
  "verdict": "CONFIRMADO" | "FALSA_ALARMA" | "REQUIERE_REVISION",
  "description": "Descripción técnica del incidente en 1-3 oraciones.",
  "confidence_estimate": 0.0-1.0
}

Criterios de veredicto:
- CONFIRMADO: hay evidencia visual clara del incidente detectado.
- FALSA_ALARMA: el sistema de detección se equivocó, la situación es normal.
- REQUIERE_REVISION: las imágenes no son suficientes para determinar con certeza.
""".strip()


def _encode_image(path: str) -> tuple[str, str] | None:
    """Codifica una imagen a base64 y detecta su media type."""
    p = Path(path)
    if not p.exists():
        logger.warning("[ClaudeVision] Frame no encontrado: %s", path)
        return None
    suffix = p.suffix.lower()
    media_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(suffix, "image/jpeg")
    with open(p, "rb") as f:
        data = base64.standard_b64encode(f.read()).decode("utf-8")
    return data, media_type


def _mock_verdict(event_type: str) -> dict:
    """Veredicto determinístico cuando no hay API key configurada."""
    if event_type in ("ROBO", "UNAUTHORIZED_ACCESS", "APERTURA_NO_AUTORIZADA"):
        verdict = VERDICT_CONFIRMADO
        desc = f"[MODO DEMO] Incidente de tipo '{event_type}' detectado con alta probabilidad de ser real."
    elif event_type in ("FALL", "MANIPULACION_CARGA", "NO_HELMET", "NO_VEST"):
        verdict = VERDICT_REQUIERE_REVISION
        desc = f"[MODO DEMO] Incidente de tipo '{event_type}'. Se recomienda revisión manual del clip."
    else:
        verdict = VERDICT_FALSA_ALARMA
        desc = "[MODO DEMO] No se encontraron indicios claros de incidente en los frames analizados."
    return {"verdict": verdict, "description": desc, "confidence_estimate": 0.75}


class ClaudeVisionClient:
    def __init__(self) -> None:
        self._api_key = getattr(settings, "ANTHROPIC_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(self._api_key)

    async def analyze_frames(
        self,
        frame_paths: list[str],
        event_type: str,
    ) -> dict:
        """
        Analiza key frames de un incidente con Claude Vision.

        Args:
            frame_paths: Paths locales a las imágenes (JPG/PNG).
            event_type: Tipo de evento detectado por YOLO.

        Returns:
            dict con 'verdict', 'description', 'confidence_estimate'.
        """
        if not self.is_configured():
            logger.info("[ClaudeVision] API key no configurada — usando modo mock")
            await asyncio.sleep(0.5)
            return _mock_verdict(event_type)

        # Filtrar frames que existen
        encoded_frames = []
        for path in frame_paths[:5]:  # máximo 5 frames por costo/latencia
            result = _encode_image(path)
            if result:
                encoded_frames.append(result)

        if not encoded_frames:
            logger.warning("[ClaudeVision] No hay frames disponibles — modo mock")
            return _mock_verdict(event_type)

        event_label = _EVENT_LABEL.get(event_type, event_type.lower().replace("_", " "))
        user_text = (
            f"El sistema de detección automática (YOLOv8) activó una alerta de tipo: **{event_label}**.\n"
            f"Analizá los {len(encoded_frames)} frames adjuntos (en orden cronológico) y determiná si el incidente es real."
        )

        # Construir contenido multimodal para Claude
        content: list[dict] = []
        for i, (data, media_type) in enumerate(encoded_frames):
            content.append({
                "type": "text",
                "text": f"Frame {i + 1} de {len(encoded_frames)}:"
            })
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media_type,
                    "data": data,
                }
            })
        content.append({"type": "text", "text": user_text})

        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=self._api_key)
            logger.info(
                "[ClaudeVision] Enviando %d frames a Claude para evento '%s'",
                len(encoded_frames), event_type
            )
            message = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=512,
                system=_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": content}],
            )
            raw = message.content[0].text.strip()
            logger.info("[ClaudeVision] Respuesta cruda: %s", raw[:200])

            import json
            # Limpiar posibles bloques de markdown
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            result = json.loads(raw)

            # Validar veredicto
            if result.get("verdict") not in VALID_VERDICTS:
                logger.warning("[ClaudeVision] Veredicto inválido '%s' — usando REQUIERE_REVISION", result.get("verdict"))
                result["verdict"] = VERDICT_REQUIERE_REVISION

            return result

        except ImportError:
            logger.error("[ClaudeVision] Paquete 'anthropic' no instalado. Instalá con: pip install anthropic")
            return _mock_verdict(event_type)
        except Exception as e:
            logger.error("[ClaudeVision] Error al llamar a Claude: %s", e)
            return _mock_verdict(event_type)


claude_vision_client = ClaudeVisionClient()

"""
Extrae un clip .mp4 del buffer circular de frames alrededor de un evento.
Extrae también key frames para Claude Vision.
"""

from __future__ import annotations

from collections import deque
from datetime import datetime, timedelta
from pathlib import Path
from typing import Deque, Tuple

import cv2

from core.config import settings


def extract_key_frames(clip_path: str, event_id: str, n: int | None = None) -> list[str]:
    """
    Extrae n frames distribuidos uniformemente del clip y los guarda como JPEG.
    Retorna la lista de paths de los frames.
    """
    n = n if n is not None else settings.KEY_FRAMES_COUNT
    cap = cv2.VideoCapture(clip_path)
    if not cap.isOpened():
        return []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        cap.release()
        return []

    out_dir = Path(settings.FRAMES_PATH) / str(event_id)
    out_dir.mkdir(parents=True, exist_ok=True)

    indices = (
        [0]
        if total_frames == 1
        else [int(i * (total_frames - 1) / (n - 1)) for i in range(n)]
        if n > 1
        else [total_frames // 2]
    )
    paths: list[str] = []

    for i, frame_idx in enumerate(indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            continue
        out_path = out_dir / f"frame_{i}.jpg"
        cv2.imwrite(str(out_path), frame)
        paths.append(str(out_path))

    cap.release()
    return paths


class ClipExtractor:
    def __init__(
        self,
        frame_buffer: Deque[Tuple[datetime, "cv2.Mat"]],
        *,
        clip_seconds: float | int | None = None,
    ) -> None:
        self.frame_buffer = frame_buffer
        self.clip_seconds = float(
            clip_seconds if clip_seconds is not None else settings.CLIP_SECONDS
        )
        self._fourcc = cv2.VideoWriter_fourcc(*"mp4v")

    def extract(
        self,
        *,
        event_timestamp: datetime,
        event_type: str,
        camera_id: str,
    ) -> str:
        start_ts = event_timestamp - timedelta(seconds=self.clip_seconds)

        frames: list[Tuple[datetime, "cv2.Mat"]] = [
            (ts, frame) for ts, frame in self.frame_buffer if start_ts <= ts <= event_timestamp
        ]
        frames.sort(key=lambda x: x[0])

        if not frames:
            raise RuntimeError("ClipExtractor: buffer sin frames para el rango del evento")

        first_ts, first_frame = frames[0]
        last_ts, last_frame = frames[-1]
        height, width = first_frame.shape[:2]

        duration = max(0.0001, (last_ts - first_ts).total_seconds())
        if len(frames) <= 1:
            fps = 30.0
        else:
            fps = (len(frames) - 1) / duration
            # Limitar fps para evitar valores extremos por gaps grandes.
            fps = float(max(5.0, min(60.0, fps)))

        # Asegurar directorio de salida.
        storage_dir = Path(settings.CLIPS_PATH)
        storage_dir.mkdir(parents=True, exist_ok=True)

        import re
        ts_str = event_timestamp.strftime("%Y%m%d_%H%M%S")
        safe_camera_id = re.sub(r'[^\w\-]', '_', str(camera_id))[:30]
        filename = f"{safe_camera_id}_{event_type}_{ts_str}.mp4"
        out_path = storage_dir / filename

        writer = cv2.VideoWriter(str(out_path), self._fourcc, fps, (int(width), int(height)))
        if not writer.isOpened():
            raise RuntimeError(f"ClipExtractor: VideoWriter no pudo abrirse en {out_path}")

        for _, frame in frames:
            writer.write(frame)

        writer.release()
        return str(out_path)


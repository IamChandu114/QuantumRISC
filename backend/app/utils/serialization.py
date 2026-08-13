from __future__ import annotations

from dataclasses import is_dataclass, asdict
from datetime import datetime
from typing import Any

from fastapi.encoders import jsonable_encoder


def to_jsonable(value: Any) -> Any:
    """Convert nested backend objects into WebSocket/JSON-safe payloads."""
    if isinstance(value, datetime):
        return value.isoformat()
    if is_dataclass(value):
        return to_jsonable(asdict(value))
    if isinstance(value, dict):
        return {key: to_jsonable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [to_jsonable(item) for item in value]
    if isinstance(value, tuple):
        return [to_jsonable(item) for item in value]
    if isinstance(value, set):
        return [to_jsonable(item) for item in value]
    return jsonable_encoder(value)

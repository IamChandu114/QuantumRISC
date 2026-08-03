from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
import asyncio
import uuid
from typing import Any

from fastapi.encoders import jsonable_encoder

from app.analyzers.forwarding_analyzer import ForwardingAnalyzer
from app.analyzers.hazard_analyzer import HazardAnalyzer
from app.analyzers.metrics_engine import MetricsEngine
from app.config.settings import Settings
from app.models.schemas import SessionSnapshot
from app.sim.compile_manager import CompileManager
from app.sim.discovery import DiscoveryService
from app.sim.run_manager import RunManager
from app.sim.vcd_parser import VCDParser
from app.trackers.memory_tracker import MemoryTracker
from app.trackers.pipeline_tracker import PipelineTracker
from app.trackers.register_tracker import RegisterTracker


@dataclass
class SessionRecord:
    id: str
    top: str
    testbench: str
    created_at: datetime
    updated_at: datetime
    status: str = "created"
    compile: dict[str, Any] = field(default_factory=dict)
    run: dict[str, Any] = field(default_factory=dict)
    parsed: dict[str, Any] = field(default_factory=dict)
    timeline: list[dict[str, Any]] = field(default_factory=list)
    cursor: int = 0
    paused: bool = True
    playback_mode: str = "idle"
    vcd_path: Path | None = None
    build_path: Path | None = None
    workdir: Path | None = None
    output_path: Path | None = None


class SessionManager:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.discovery = DiscoveryService(settings.repo_root)
        self.compile_manager = CompileManager(settings.iverilog_path)
        self.run_manager = RunManager(settings.vvp_path)
        self.vcd_parser = VCDParser()
        self.register_tracker = RegisterTracker()
        self.memory_tracker = MemoryTracker()
        self.pipeline_tracker = PipelineTracker()
        self.hazard_analyzer = HazardAnalyzer()
        self.forwarding_analyzer = ForwardingAnalyzer()
        self.metrics_engine = MetricsEngine()
        self.sessions: dict[str, SessionRecord] = {}
        self.subscribers: dict[str, list[asyncio.Queue]] = {}
        self.playback_tasks: dict[str, asyncio.Task] = {}

    def create_session(self, top: str, testbench: str) -> SessionRecord:
        session_id = uuid.uuid4().hex[:12]
        now = datetime.now(timezone.utc)
        record = SessionRecord(id=session_id, top=top, testbench=testbench, created_at=now, updated_at=now)
        record.workdir = self.settings.runs_root / session_id
        record.build_path = record.workdir / "build" / f"{session_id}.vvp"
        record.output_path = record.workdir
        record.workdir.mkdir(parents=True, exist_ok=True)
        self.sessions[session_id] = record
        self.subscribers[session_id] = []
        return record

    def get(self, session_id: str) -> SessionRecord:
        return self.sessions[session_id]

    def add_subscriber(self, session_id: str, queue: asyncio.Queue) -> None:
        self.subscribers.setdefault(session_id, []).append(queue)

    def remove_subscriber(self, session_id: str, queue: asyncio.Queue) -> None:
        queues = self.subscribers.get(session_id, [])
        if queue in queues:
            queues.remove(queue)

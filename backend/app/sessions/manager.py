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
from app.sessions.db import init_db, save_session, load_sessions


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
        
        # SQLite persistence initialization
        init_db(settings.sqlite_db_path)
        self.sessions: dict[str, SessionRecord] = load_sessions(settings.sqlite_db_path)
        
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
        save_session(self.settings.sqlite_db_path, record)
        return record

    def get(self, session_id: str) -> SessionRecord:
        return self.sessions[session_id]

    def add_subscriber(self, session_id: str, queue: asyncio.Queue) -> None:
        self.subscribers.setdefault(session_id, []).append(queue)

    def remove_subscriber(self, session_id: str, queue: asyncio.Queue) -> None:
        queues = self.subscribers.get(session_id, [])
        if queue in queues:
            queues.remove(queue)

    async def broadcast(self, session_id: str, event: dict[str, Any]) -> None:
        encoded = jsonable_encoder(event)
        for queue in list(self.subscribers.get(session_id, [])):
            await queue.put(encoded)

    def _source_files(self) -> list[Path]:
        rtl = sorted((self.settings.repo_root / "rtl").rglob("*.sv"))
        verification = sorted((self.settings.repo_root / "verification").rglob("*.sv"))
        return [*rtl, *verification]

    def _current_timeline(self, session: SessionRecord) -> list[dict[str, Any]]:
        if not session.timeline:
            return []
        cursor = max(0, min(session.cursor, len(session.timeline) - 1))
        return session.timeline[: cursor + 1]

    async def _broadcast_state(self, session_id: str) -> None:
        await self.broadcast(session_id, {"type": "state.snapshot", "payload": self.snapshot(session_id).model_dump()})

    async def _playback_loop(self, session_id: str) -> None:
        try:
            while True:
                session = self.get(session_id)
                if session.paused or session.cursor >= max(0, len(session.timeline) - 1):
                    break
                session.cursor += 1
                session.updated_at = datetime.now(timezone.utc)
                await self._broadcast_state(session_id)
                await self.broadcast(session_id, {
                    "type": "state.delta",
                    "payload": {
                        "session_id": session_id,
                        "cursor": session.cursor,
                        "updated_at": session.updated_at.isoformat(),
                    },
                })
                await asyncio.sleep(0.075)
        finally:
            self.playback_tasks.pop(session_id, None)

    async def pause(self, session_id: str) -> dict[str, Any]:
        session = self.get(session_id)
        session.paused = True
        session.playback_mode = "paused"
        task = self.playback_tasks.pop(session_id, None)
        if task:
            task.cancel()
        session.updated_at = datetime.now(timezone.utc)
        await self.broadcast(session_id, {"type": "session.paused", "payload": {"session_id": session_id, "cursor": session.cursor}})
        await self._broadcast_state(session_id)
        save_session(self.settings.sqlite_db_path, session)
        return self.snapshot(session_id).model_dump()

    async def resume(self, session_id: str) -> dict[str, Any]:
        session = self.get(session_id)
        if not session.timeline:
            return self.snapshot(session_id).model_dump()
        session.paused = False
        session.playback_mode = "playing"
        if session_id not in self.playback_tasks:
            self.playback_tasks[session_id] = asyncio.create_task(self._playback_loop(session_id))
        session.updated_at = datetime.now(timezone.utc)
        await self.broadcast(session_id, {"type": "session.resumed", "payload": {"session_id": session_id, "cursor": session.cursor}})
        await self._broadcast_state(session_id)
        save_session(self.settings.sqlite_db_path, session)
        return self.snapshot(session_id).model_dump()

    async def reset(self, session_id: str) -> dict[str, Any]:
        session = self.get(session_id)
        session.paused = True
        session.playback_mode = "idle"
        task = self.playback_tasks.pop(session_id, None)
        if task:
            task.cancel()
        session.cursor = 0
        session.updated_at = datetime.now(timezone.utc)
        await self.broadcast(session_id, {"type": "session.reset", "payload": {"session_id": session_id, "cursor": session.cursor}})
        await self._broadcast_state(session_id)
        save_session(self.settings.sqlite_db_path, session)
        return self.snapshot(session_id).model_dump()

    async def step(self, session_id: str) -> dict[str, Any]:
        session = self.get(session_id)
        session.paused = True
        session.playback_mode = "stepping"
        task = self.playback_tasks.pop(session_id, None)
        if task:
            task.cancel()
        session.cursor = min(session.cursor + 1, max(0, len(session.timeline) - 1))
        session.updated_at = datetime.now(timezone.utc)
        await self.broadcast(session_id, {"type": "session.step", "payload": {"session_id": session_id, "cursor": session.cursor}})
        await self._broadcast_state(session_id)
        save_session(self.settings.sqlite_db_path, session)
        return self.snapshot(session_id).model_dump()

    async def compile(self, session_id: str) -> dict[str, Any]:
        session = self.get(session_id)
        await self.broadcast(session_id, {"type": "compile.started", "session_id": session_id})
        sources = self._source_files()
        result = await self.compile_manager.compile(sources, session.testbench, session.build_path, session.workdir)
        session.compile = {
            "ok": result.ok,
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "executable": str(result.executable) if result.executable else None,
        }
        session.updated_at = datetime.now(timezone.utc)
        session.status = "compiled" if result.ok else "compile_error"
        save_session(self.settings.sqlite_db_path, session)
        await self.broadcast(session_id, {"type": "compile.finished" if result.ok else "compile.error", "payload": session.compile})
        return session.compile

    async def run(self, session_id: str) -> dict[str, Any]:
        session = self.get(session_id)
        if not session.build_path or not session.build_path.exists():
            await self.compile(session_id)
        if not session.build_path or not session.build_path.exists():
            save_session(self.settings.sqlite_db_path, session)
            return session.run
        await self.broadcast(session_id, {"type": "run.started", "session_id": session_id})
        result = await self.run_manager.run(session.build_path, session.workdir)
        session.run = {
            "ok": result.ok,
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "vcd_path": str(result.vcd_path) if result.vcd_path else None,
        }
        session.vcd_path = result.vcd_path
        session.status = "running" if result.ok else "run_error"
        await self.broadcast(session_id, {"type": "run.stdout", "payload": result.stdout})
        if result.stderr:
            await self.broadcast(session_id, {"type": "run.stderr", "payload": result.stderr})
        if result.ok and result.vcd_path:
            parsed = self.vcd_parser.parse(result.vcd_path)
            registers = self.register_tracker.snapshot(parsed.timeline)
            memory = self.memory_tracker.snapshot(parsed.timeline)
            pipeline = self.pipeline_tracker.snapshot(parsed.timeline)
            hazards = self.hazard_analyzer.analyze(parsed.timeline)
            forwarding = self.forwarding_analyzer.analyze(hazards)
            metrics = self.metrics_engine.analyze(parsed.timeline, hazards)
            session.timeline = parsed.timeline
            session.cursor = max(0, len(session.timeline) - 1)
            session.paused = True
            session.playback_mode = "paused"
            session.parsed = {
                "signals": list(parsed.signals.keys()),
                "timeline": parsed.timeline,
                "samples": parsed.samples,
            }
            session.status = "finished"
            session.updated_at = datetime.now(timezone.utc)
            save_session(self.settings.sqlite_db_path, session)
            await self._broadcast_state(session_id)
            await self.broadcast(session_id, {"type": "run.finished", "payload": session.run})
            for event_name, value in (
                ("registers.update", registers),
                ("memory.update", memory),
                ("pipeline.update", pipeline),
                ("hazard.update", hazards),
                ("forwarding.update", forwarding),
                ("metrics.update", metrics),
                ("state.delta", {"session_id": session_id, "updated_at": session.updated_at.isoformat()}),
            ):
                await self.broadcast(session_id, {"type": event_name, "payload": value})
                await asyncio.sleep(0)
        elif not result.ok:
            session.status = "run_error"
            save_session(self.settings.sqlite_db_path, session)
            await self.broadcast(session_id, {"type": "run.error", "payload": session.run})
        return session.run

    def snapshot(self, session_id: str) -> SessionSnapshot:
        session = self.get(session_id)
        timeline = self._current_timeline(session)
        registers = self.register_tracker.snapshot(timeline)
        memory = self.memory_tracker.snapshot(timeline)
        pipeline = self.pipeline_tracker.snapshot(timeline)
        hazards = self.hazard_analyzer.analyze(timeline)
        forwarding = self.forwarding_analyzer.analyze(hazards)
        metrics = self.metrics_engine.analyze(timeline, hazards)
        current_sample = timeline[-1]["changed"] if timeline else {}
        return SessionSnapshot(
            session_id=session.id,
            status=session.status,
            top=session.top,
            testbench=session.testbench,
            created_at=session.created_at,
            updated_at=session.updated_at,
            playback={
                "cursor": session.cursor,
                "total": len(session.timeline),
                "paused": session.paused,
                "mode": session.playback_mode,
            },
            compile=session.compile,
            run=session.run,
            architecture={"signals": session.parsed.get("signals", [])},
            registers=registers,
            memory=memory,
            pipeline=pipeline,
            hazards=hazards,
            forwarding=forwarding,
            metrics=metrics,
            waveforms={"timeline": session.timeline, "signals": session.parsed.get("signals", []), "cursor": session.cursor, "current": current_sample},
            vcd={"path": str(session.vcd_path) if session.vcd_path else None, "name": session.vcd_path.name if session.vcd_path else None},
        )

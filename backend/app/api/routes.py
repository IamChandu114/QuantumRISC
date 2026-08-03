from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.models.schemas import DiscoveryResponse, SessionCreateRequest, SessionCreateResponse, CompileResponse, RunResponse
from app.sessions.manager import SessionManager


def build_router(manager: SessionManager) -> APIRouter:
    router = APIRouter()

    @router.get("/api/health")
    async def health():
        return {"ok": True}

    @router.get("/api/discovery", response_model=DiscoveryResponse)
    async def discovery():
        d = manager.discovery.discover()
        return DiscoveryResponse(
            tops=d.tops,
            smoke_tops=d.smoke_tops,
            testbenches=d.testbenches,
            rtl_files=[{"path": str(f.path.relative_to(manager.settings.repo_root)), "kind": "rtl", "module_names": f.module_names} for f in d.rtl_files],
            verification_files=[{"path": str(f.path.relative_to(manager.settings.repo_root)), "kind": "verification", "module_names": f.module_names} for f in d.verification_files],
            default_top=d.default_top,
            default_testbench=d.default_testbench,
        )

    @router.post("/api/sessions", response_model=SessionCreateResponse)
    async def create_session(payload: SessionCreateRequest):
        d = manager.discovery.discover()
        testbench = payload.testbench or d.default_testbench
        top = payload.top or "pipeline_cpu_complete"
        if testbench and testbench.endswith("_tb"):
            top = payload.top or top
        record = manager.create_session(top=top, testbench=testbench)
        return SessionCreateResponse(id=record.id, top=record.top, testbench=record.testbench, created_at=record.created_at)

    @router.get("/api/sessions/{session_id}")
    async def get_session(session_id: str):
        try:
            return manager.snapshot(session_id).model_dump()
        except KeyError:
            raise HTTPException(status_code=404, detail="Session not found")

    @router.post("/api/sessions/{session_id}/compile", response_model=CompileResponse)
    async def compile_session(session_id: str):
        result = await manager.compile(session_id)
        return CompileResponse(**result)

    @router.post("/api/sessions/{session_id}/run", response_model=RunResponse)
    async def run_session(session_id: str):
        result = await manager.run(session_id)
        return RunResponse(**result)

    @router.post("/api/sessions/{session_id}/pause")
    async def pause_session(session_id: str):
        try:
            return await manager.pause(session_id)
        except KeyError:
            raise HTTPException(status_code=404, detail="Session not found")

    @router.post("/api/sessions/{session_id}/resume")
    async def resume_session(session_id: str):
        try:
            return await manager.resume(session_id)
        except KeyError:
            raise HTTPException(status_code=404, detail="Session not found")

    @router.post("/api/sessions/{session_id}/reset")
    async def reset_session(session_id: str):
        try:
            return await manager.reset(session_id)
        except KeyError:
            raise HTTPException(status_code=404, detail="Session not found")

    @router.post("/api/sessions/{session_id}/step")
    async def step_session(session_id: str):
        try:
            return await manager.step(session_id)
        except KeyError:
            raise HTTPException(status_code=404, detail="Session not found")

    @router.get("/api/sessions/{session_id}/snapshot")
    async def snapshot(session_id: str):
        try:
            return manager.snapshot(session_id).model_dump()
        except KeyError:
            raise HTTPException(status_code=404, detail="Session not found")

    @router.get("/api/sessions/{session_id}/vcd")
    async def vcd(session_id: str):
        session = manager.get(session_id)
        if not session.vcd_path or not session.vcd_path.exists():
            raise HTTPException(status_code=404, detail="VCD not available")
        return {"path": str(session.vcd_path), "name": session.vcd_path.name}

    @router.websocket("/ws/sessions/{session_id}")
    async def session_ws(websocket: WebSocket, session_id: str):
        await websocket.accept()
        queue: asyncio.Queue = asyncio.Queue()
        manager.add_subscriber(session_id, queue)
        try:
            await websocket.send_json({"type": "session.created", "session_id": session_id})
            while True:
                event = await queue.get()
                await websocket.send_json(event)
        except WebSocketDisconnect:
            pass
        finally:
            manager.remove_subscriber(session_id, queue)

    return router

import time

from fastapi.testclient import TestClient

from app.main import app


def test_api_real_simulation_smoke() -> None:
    """Exercise the deployed API shape against the real Icarus toolchain."""
    with TestClient(app) as client:
        health = client.get("/api/health")
        assert health.status_code == 200
        assert health.json()["ok"] is True

        discovery = client.get("/api/discovery")
        assert discovery.status_code == 200
        assert discovery.json()["default_top"] == "pipeline_cpu_complete"
        assert discovery.json()["default_testbench"] == "pipeline_cpu_complete_tb"

        created = client.post("/api/sessions", json={})
        assert created.status_code == 200
        session_id = created.json()["id"]

        compile_result = client.post(f"/api/sessions/{session_id}/compile")
        assert compile_result.status_code == 200
        assert compile_result.json()["ok"] is True

        run_result = client.post(f"/api/sessions/{session_id}/run")
        assert run_result.status_code == 200
        assert run_result.json()["ok"] is True

        with client.websocket_connect(f"/ws/sessions/{session_id}") as websocket:
            assert websocket.receive_json()["type"] == "session.created"
            assert websocket.receive_json()["type"] == "state.snapshot"

        deadline = time.monotonic() + 65
        while time.monotonic() < deadline:
            snapshot = client.get(f"/api/sessions/{session_id}/snapshot").json()
            if snapshot["run"].get("ok"):
                break
            time.sleep(0.2)
        else:
            raise AssertionError(f"Real simulation did not complete: {snapshot['run']}")

        assert snapshot["compile"]["ok"] is True
        assert snapshot["run"]["ok"] is True
        assert snapshot["vcd"]["path"]
        assert snapshot["playback"]["total"] > 0
        assert client.post(f"/api/sessions/{session_id}/step").status_code == 200
        reset = client.post(f"/api/sessions/{session_id}/reset")
        assert reset.status_code == 200
        assert reset.json()["playback"]["cursor"] == 0

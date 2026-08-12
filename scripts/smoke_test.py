from __future__ import annotations

import subprocess
import sys
import shutil
from pathlib import Path

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable
NPM = shutil.which("npm.cmd") or shutil.which("npm") or "npm"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def run(cmd: list[str], cwd: Path) -> None:
    print(f"$ {' '.join(cmd)}")
    subprocess.run(cmd, cwd=cwd, check=True)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> int:
    run([PYTHON, "-m", "compileall", "backend"], ROOT)
    run(["node", "--check", str(ROOT / "frontend" / "studio" / "backend-bridge.js")], ROOT)
    run([NPM, "run", "build"], ROOT / "frontend" / "website")

    from app.main import app

    client = TestClient(app)

    health = client.get("/api/health")
    assert_true(health.status_code == 200 and health.json().get("ok") is True, "Health check failed")

    discovery = client.get("/api/discovery")
    assert_true(discovery.status_code == 200, "Discovery endpoint failed")
    disc = discovery.json()
    assert_true("pipeline_cpu_complete" in disc["tops"], "pipeline_cpu_complete top not discovered")
    assert_true("pipeline_cpu_complete_tb" in disc["testbenches"], "pipeline_cpu_complete_tb not discovered")

    session = client.post(
        "/api/sessions",
        json={"top": "pipeline_cpu_complete", "testbench": disc["default_testbench"]},
    )
    assert_true(session.status_code == 200, "Session creation failed")
    session_id = session.json()["id"]

    compile_res = client.post(f"/api/sessions/{session_id}/compile")
    assert_true(compile_res.status_code == 200 and compile_res.json()["ok"] is True, "Compile failed")

    run_res = client.post(f"/api/sessions/{session_id}/run")
    assert_true(run_res.status_code == 200 and run_res.json()["ok"] is True, "Run failed")

    snapshot_res = client.get(f"/api/sessions/{session_id}/snapshot")
    assert_true(snapshot_res.status_code == 200, "Snapshot failed")
    snapshot = snapshot_res.json()
    assert_true(snapshot["compile"]["ok"] is True, "Snapshot compile state is false")
    assert_true(snapshot["run"]["ok"] is True, "Snapshot run state is false")
    assert_true(bool(snapshot["vcd"].get("name")), "VCD name missing from snapshot")
    assert_true(len(snapshot["registers"]) == 32, "Register snapshot incomplete")
    assert_true(len(snapshot["waveforms"].get("timeline", [])) > 0, "Waveform timeline missing")

    root = client.get("/")
    assert_true(root.status_code == 200, "Website root failed")
    assert_true("/assets/" in root.text, "Built website assets not referenced from root page")

    studio = client.get("/studio")
    assert_true(studio.status_code == 200, "Studio route failed")
    assert_true("backend-bridge.js" in studio.text, "Studio bridge not loaded")

    with client.websocket_connect(f"/ws/sessions/{session_id}") as ws:
        first = ws.receive_json()

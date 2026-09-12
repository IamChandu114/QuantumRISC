from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import asyncio
import shutil


@dataclass
class RunResult:
    ok: bool
    returncode: int
    stdout: str
    stderr: str
    vcd_path: Path | None


class RunManager:
    def __init__(self, vvp_path: str):
        self.vvp_path = vvp_path

    async def run(self, executable: Path, workdir: Path) -> RunResult:
        simulator = shutil.which(self.vvp_path) or (self.vvp_path if Path(self.vvp_path).is_file() else None)
        if not simulator:
            return RunResult(False, -1, "", "VVP_UNAVAILABLE: Icarus Verilog runtime unavailable.", None)
        try:
            proc = await asyncio.create_subprocess_exec(
                simulator,
                str(executable),
                cwd=str(workdir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout_b, stderr_b = await asyncio.wait_for(proc.communicate(), timeout=60)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.communicate()
            return RunResult(False, -1, "", "SIMULATION_FAILED: VVP simulation timed out.", None)
        except OSError as exc:
            return RunResult(False, -1, "", f"SIMULATION_FAILED: Unable to start VVP: {exc}", None)
        stdout = stdout_b.decode("utf-8", errors="ignore")
        stderr = stderr_b.decode("utf-8", errors="ignore")
        vcd_path = self._guess_vcd_path(workdir)
        if proc.returncode != 0:
            return RunResult(False, proc.returncode or -1, stdout, stderr, None)
        if not vcd_path.exists():
            diagnostic = "VCD_NOT_GENERATED: Simulation completed but no VCD waveform was generated."
            return RunResult(False, proc.returncode or 0, stdout, f"{stderr}\n{diagnostic}".strip(), None)
        return RunResult(True, proc.returncode or 0, stdout, stderr, vcd_path)

    def _guess_vcd_path(self, workdir: Path) -> Path:
        candidates = sorted(workdir.rglob("*.vcd"))
        if candidates:
            return candidates[0]
        candidates = [workdir / "pipeline_complete.vcd", workdir / "cpu_dump.vcd"]
        for candidate in candidates:
            if candidate.exists():
                return candidate
        return candidates[0]

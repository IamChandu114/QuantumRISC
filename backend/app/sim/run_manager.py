from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import asyncio


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
        proc = await asyncio.create_subprocess_exec(
            self.vvp_path,
            str(executable),
            cwd=str(workdir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout_b, stderr_b = await proc.communicate()
        stdout = stdout_b.decode("utf-8", errors="ignore")
        stderr = stderr_b.decode("utf-8", errors="ignore")
        vcd_path = self._guess_vcd_path(workdir)
        return RunResult(ok=proc.returncode == 0, returncode=proc.returncode or 0, stdout=stdout, stderr=stderr, vcd_path=vcd_path if vcd_path.exists() else None)

    def _guess_vcd_path(self, workdir: Path) -> Path:
        candidates = sorted(workdir.rglob("*.vcd"))
        if candidates:
            return candidates[0]
        candidates = [workdir / "pipeline_complete.vcd", workdir / "cpu_dump.vcd"]
        for candidate in candidates:
            if candidate.exists():
                return candidate
        return candidates[0]

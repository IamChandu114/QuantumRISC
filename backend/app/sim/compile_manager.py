from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import asyncio
import subprocess


@dataclass
class CompileResult:
    ok: bool
    returncode: int
    stdout: str
    stderr: str
    executable: Path | None = None


class CompileManager:
    def __init__(self, iverilog_path: str):
        self.iverilog_path = iverilog_path

    async def compile(self, source_files: list[Path], top: str, out_file: Path, workdir: Path) -> CompileResult:
        out_file.parent.mkdir(parents=True, exist_ok=True)
        cmd = [self.iverilog_path, "-g2012", "-Wall", "-s", top, "-o", str(out_file), *[str(p) for p in source_files]]
        completed = await asyncio.to_thread(self._run_subprocess, cmd, workdir)
        return CompileResult(
            ok=completed.returncode == 0,
            returncode=completed.returncode or 0,
            stdout=completed.stdout or "",
            stderr=completed.stderr or "",
            executable=out_file if completed.returncode == 0 else None,
        )

    def _run_subprocess(self, cmd: list[str], workdir: Path) -> subprocess.CompletedProcess[str]:
        # Windows is more reliable here when subprocess execution happens in a worker thread.
        return subprocess.run(
            cmd,
            cwd=str(workdir),
            capture_output=True,
            text=True,
            check=False,
        )

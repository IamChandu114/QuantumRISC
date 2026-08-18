from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
import re


MODULE_RE = re.compile(r"(?m)^\s*module\s+([a-zA-Z_][a-zA-Z0-9_]*)\b")
INSTANTIATION_RE = re.compile(r"(?m)^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(")


@dataclass
class DiscoveredFile:
    path: Path
    kind: str
    module_names: list[str] = field(default_factory=list)


@dataclass
class DiscoveryResult:
    tops: list[str]
    smoke_tops: list[str]
    testbenches: list[str]
    rtl_files: list[DiscoveredFile]
    verification_files: list[DiscoveredFile]
    default_top: str
    default_testbench: str


class DiscoveryService:
    def __init__(self, repo_root: Path):
        self.repo_root = repo_root

    def _scan_sv(self, base: Path, kind: str) -> list[DiscoveredFile]:
        found: list[DiscoveredFile] = []
        if not base.exists():
            return found
        for path in sorted(base.rglob("*.sv")):
            text = path.read_text(encoding="utf-8", errors="ignore")
            module_names = MODULE_RE.findall(text)
            found.append(DiscoveredFile(path=path, kind=kind, module_names=module_names))
        return found

    def _module_usage(self, files: list[DiscoveredFile]) -> dict[str, int]:
        counts: dict[str, int] = {}
        for f in files:
            text = f.path.read_text(encoding="utf-8", errors="ignore")
            for match in re.findall(r"(?m)^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(", text):
                counts[match] = counts.get(match, 0) + 1
        return counts

    def discover(self) -> DiscoveryResult:
        rtl_dir = self.repo_root / "rtl"
        if not rtl_dir.exists() and (self.repo_root / "backend" / "rtl").exists():
            rtl_dir = self.repo_root / "backend" / "rtl"

        verif_dir = self.repo_root / "verification"
        if not verif_dir.exists() and (self.repo_root / "backend" / "verification").exists():
            verif_dir = self.repo_root / "backend" / "verification"

        rtl_files = self._scan_sv(rtl_dir, "rtl")
        verification_files = self._scan_sv(verif_dir, "verification")
        all_files = rtl_files + verification_files
        usage = self._module_usage(all_files)
        modules = []
        for f in all_files:
            modules.extend(f.module_names)

        testbenches = [name for name in modules if name.endswith("_tb")]
        top_candidates = [
            name for name in modules
            if not name.endswith("_tb") and usage.get(name, 0) == 0
        ]
        preferred = [m for m in ("pipeline_cpu_complete", "cpu_top") if m in modules]
        tops = preferred + [m for m in top_candidates if m not in preferred]
        smoke_tops = [m for m in ("cpu_top", "pipeline_cpu_complete") if m in modules]
        default_top = preferred[0] if preferred else (top_candidates[0] if top_candidates else "")
        default_testbench = next((tb for tb in ("pipeline_cpu_complete_tb", "cpu_top_tb") if tb in testbenches), (testbenches[0] if testbenches else ""))
        return DiscoveryResult(
            tops=tops,
            smoke_tops=smoke_tops,
            testbenches=sorted(dict.fromkeys(testbenches)),
            rtl_files=rtl_files,
            verification_files=verification_files,
            default_top=default_top,
            default_testbench=default_testbench,
        )

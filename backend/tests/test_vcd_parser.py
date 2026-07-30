from pathlib import Path

from backend.app.sim.vcd_parser import VCDParser


def test_parser_handles_missing_file(tmp_path: Path):
    parser = VCDParser()
    result = parser.parse(tmp_path / "missing.vcd")
    assert result.timeline == []


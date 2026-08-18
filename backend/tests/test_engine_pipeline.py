import asyncio
from pathlib import Path
import tempfile

from app.config.settings import get_settings
from app.sim.vcd_parser import VCDParser
from app.analyzers.metrics_engine import MetricsEngine
from app.trackers.register_tracker import RegisterTracker
from app.sessions.manager import SessionManager


def test_vcd_parser_scope_and_timestamps():
    vcd_content = """$date
	Tue Aug 18 2026
$end
$version
	Icarus Verilog
$end
$timescale
	1ps
$end
$scope module top $end
$var reg 1 ! clk $end
$var reg 1 " reset $end
$scope module dut $end
$var wire 1 ! clk $end
$var wire 32 # pc [31:0] $end
$upscope $end
$upscope $end
$enddefinitions $end
#0
$dumpvars
0!
1"
b0 #
$end
#5000
1!
#10000
0!
0"
b100 #
#15000
1!
#20000
0!
b1000 #
"""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".vcd") as f:
        f.write(vcd_content)
        tmp_path = Path(f.name)

    try:
        parser = VCDParser()
        result = parser.parse(tmp_path)
        assert len(result.signals) >= 3
        assert "top.clk" in result.signals
        assert "top.dut.clk" in result.signals
        # 5 distinct timestamps (#0, #5000, #10000, #15000, #20000)
        assert len(result.timeline) == 5
        sample_15k = result.timeline[-1]["changed"]
        assert sample_15k.get("top.clk") == "0"
        assert sample_15k.get("top.dut.clk") == "0"
    finally:
        tmp_path.unlink(missing_ok=True)


def test_metrics_engine_cycle_and_retired():
    engine = MetricsEngine()
    timeline = [
        {"time": 0, "changed": {"top.clk": "0", "top.reset": "1", "top.dut.if_instruction [31:0]": "0"}},
        {"time": 5000, "changed": {"top.clk": "1", "top.reset": "1", "top.dut.if_instruction [31:0]": "0"}},
        {"time": 10000, "changed": {"top.clk": "0", "top.reset": "0", "top.dut.if_instruction [31:0]": "0"}},
        {"time": 15000, "changed": {"top.clk": "1", "top.reset": "0", "top.dut.if_instruction [31:0]": "0x00A00093"}},
        {"time": 20000, "changed": {"top.clk": "0", "top.reset": "0", "top.dut.if_instruction [31:0]": "0x00A00093"}},
        {"time": 25000, "changed": {"top.clk": "1", "top.reset": "0", "top.dut.if_instruction [31:0]": "0x00A08533"}},
    ]
    hazards = []
    res = engine.analyze(timeline, hazards)
    assert res["cycles"] == 2  # 2 rising edges after reset=0
    assert res["retired"] == 2
    assert res["ipc"] == 1.0
    assert res["cpi"] == 1.0


def test_register_tracker_multiple_writes():
    tracker = RegisterTracker()
    timeline = [
        {"changed": {"pipeline_cpu_complete_tb.DUT.RF.rd [4:0]": "1", "pipeline_cpu_complete_tb.DUT.RF.write_data [31:0]": "10", "pipeline_cpu_complete_tb.DUT.RegWrite": "1"}},
        {"changed": {"pipeline_cpu_complete_tb.DUT.RF.rd [4:0]": "1", "pipeline_cpu_complete_tb.DUT.RF.write_data [31:0]": "25", "pipeline_cpu_complete_tb.DUT.RegWrite": "1"}},
        {"changed": {"pipeline_cpu_complete_tb.DUT.RF.rd [4:0]": "2", "pipeline_cpu_complete_tb.DUT.RF.write_data [31:0]": "50", "pipeline_cpu_complete_tb.DUT.RegWrite": "1"}},
    ]
    regs = tracker.snapshot(timeline)
    reg_x1 = next(r for r in regs if r["name"] == "x1")
    reg_x2 = next(r for r in regs if r["name"] == "x2")
    assert reg_x1["value"] == "0x00000019"  # 25 in hex
    assert reg_x2["value"] == "0x00000032"  # 50 in hex


def test_session_manager_end_to_end():
    settings = get_settings()
    manager = SessionManager(settings)
    session = manager.create_session("pipeline_cpu_complete", "pipeline_cpu_complete_tb")
    
    async def run_bootstrap():
        await manager.compile(session.id)
        await manager.run(session.id)
    
    asyncio.run(run_bootstrap())
    
    snap = manager.snapshot(session.id)
    assert snap.compile.get("ok") is True
    assert snap.run.get("ok") is True
    assert snap.metrics.get("cycles") > 0
    assert snap.metrics.get("retired") > 0
    assert snap.metrics.get("ipc") > 0

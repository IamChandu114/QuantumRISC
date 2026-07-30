from __future__ import annotations

from typing import Any


class PipelineTracker:
    def snapshot(self, timeline: list[dict[str, Any]]) -> dict[str, Any]:
        changed = timeline[-1].get("changed", {}) if timeline else {}
        return {
            "pc": self._fmt(changed.get("pipeline_cpu_complete_tb.DUT.PC.pc_current [31:0]") or changed.get("cpu_top_tb.dut.pc_debug [31:0]")),
            "instruction": self._fmt(changed.get("pipeline_cpu_complete_tb.DUT.if_instruction [31:0]") or changed.get("cpu_top_tb.dut.instruction_debug [31:0]") or changed.get("cpu_top_tb.dut.instruction [31:0]")),
            "opcode": self._fmt(changed.get("pipeline_cpu_complete_tb.DUT.opcode [6:0]") or changed.get("cpu_top_tb.dut.opcode [6:0]")),
            "rs1": self._fmt(changed.get("pipeline_cpu_complete_tb.DUT.rs1 [4:0]") or changed.get("cpu_top_tb.dut.rs1 [4:0]")),
            "rs2": self._fmt(changed.get("pipeline_cpu_complete_tb.DUT.rs2 [4:0]") or changed.get("cpu_top_tb.dut.rs2 [4:0]")),
            "rd": self._fmt(changed.get("pipeline_cpu_complete_tb.DUT.rd [4:0]") or changed.get("cpu_top_tb.dut.rd [4:0]")),
            "immediate": self._fmt(changed.get("pipeline_cpu_complete_tb.DUT.immediate [31:0]") or changed.get("cpu_top_tb.dut.immediate [31:0]")),
            "alu_result": self._fmt(changed.get("pipeline_cpu_complete_tb.DUT.alu_result [31:0]") or changed.get("cpu_top_tb.dut.alu_result [31:0]")),
            "writeback_data": self._fmt(changed.get("pipeline_cpu_complete_tb.DUT.writeback_data [31:0]") or changed.get("cpu_top_tb.dut.alu_result [31:0]")),
            "regwrite": self._fmt(changed.get("pipeline_cpu_complete_tb.DUT.RegWrite") or changed.get("cpu_top_tb.dut.RegWrite")),
        }

    def _fmt(self, value: Any) -> str:
        if value is None:
            return "0x0"
        text = str(value).strip()
        if text == "":
            return "0x0"
        if all(ch in "01" for ch in text):
            try:
                return f"0x{int(text, 2):X}"
            except ValueError:
                return text
        return text


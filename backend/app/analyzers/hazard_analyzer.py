from __future__ import annotations

from typing import Any


def _reg_reads(opcode: int, word: int) -> tuple[int | None, int | None, int | None]:
    rd = (word >> 7) & 0x1F
    rs1 = (word >> 15) & 0x1F
    rs2 = (word >> 20) & 0x1F
    if opcode in (0b0010011, 0b0000011, 0b1100111):
        return rd, rs1, None
    if opcode in (0b0110011, 0b0100011, 0b1100011):
        return (rd if opcode != 0b0100011 else None), rs1, rs2
    return rd, rs1, rs2


class HazardAnalyzer:
    def analyze(self, timeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
        program = self._program_events(timeline)
        hazards: list[dict[str, Any]] = []
        for i in range(1, len(program)):
            prev = program[i - 1]
            curr = program[i]
            prev_opcode = prev["instr"] & 0x7F
            curr_opcode = curr["instr"] & 0x7F
            prev_rd, _, _ = _reg_reads(prev_opcode, prev["instr"])
            _, curr_rs1, curr_rs2 = _reg_reads(curr_opcode, curr["instr"])
            sources = {r for r in (curr_rs1, curr_rs2) if r is not None}
            if prev_rd and prev_rd in sources:
                hazards.append({
                    "kind": "RAW",
                    "resolved": "forwarded",
                    "producer_pc": f"0x{prev['pc']:08X}",
                    "consumer_pc": f"0x{curr['pc']:08X}",
                    "producer_rd": prev_rd,
                })
        return hazards

    def _program_events(self, timeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        seen: set[int] = set()
        for sample in timeline:
            changed = sample.get("changed", {})
            pc = self._to_int(
                changed.get("pipeline_cpu_complete_tb.DUT.PC.pc_current [31:0]")
                or changed.get("cpu_top_tb.dut.pc_debug [31:0]")
            )
            rd = self._to_int(
                changed.get("pipeline_cpu_complete_tb.DUT.RF.rd [4:0]")
                or changed.get("cpu_top_tb.dut.rd [4:0]")
            )
            instr = self._to_int(
                changed.get("pipeline_cpu_complete_tb.DUT.if_instruction [31:0]")
                or changed.get("cpu_top_tb.dut.instruction_debug [31:0]")
                or changed.get("cpu_top_tb.dut.instruction [31:0]")
            )
            writeback = self._to_int(
                changed.get("pipeline_cpu_complete_tb.DUT.RF.write_data [31:0]")
                or changed.get("cpu_top_tb.dut.alu_result [31:0]")
            )
            if rd is None or instr is None or rd == 0 or rd in seen or writeback is None or writeback == 0:
                continue
            seen.add(rd)
            events.append({"pc": pc if pc is not None else len(events) * 4, "rd": rd, "instr": instr})
        return events

    def _to_int(self, value: Any) -> int | None:
        if value is None:
            return None
        text = str(value).strip()
        if text == "" or any(ch in text for ch in "xXzZ"):
            return None
        if all(ch in "01" for ch in text):
            try:
                return int(text, 2)
            except ValueError:
                return None
        try:
            return int(text, 0)
        except ValueError:
            return None

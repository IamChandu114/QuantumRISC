from __future__ import annotations

from typing import Any


class ForwardingAnalyzer:
    def analyze(self, hazards: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                "path": "EX/MEM -> EX",
                "reason": h.get("kind", "RAW"),
                "consumer_pc": h.get("consumer_pc"),
                "producer_pc": h.get("producer_pc"),
            }
            for h in hazards
        ]


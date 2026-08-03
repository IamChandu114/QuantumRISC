from pathlib import Path

from app.config.settings import get_settings
from app.sim.discovery import DiscoveryService


def test_discovery_finds_tb():
    settings = get_settings()
    discovery = DiscoveryService(settings.repo_root).discover()
    assert "cpu_top_tb" in discovery.testbenches
    assert "pipeline_cpu_complete_tb" in discovery.testbenches


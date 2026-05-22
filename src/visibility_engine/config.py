from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Settings:
    anthropic_api_key: str = field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", ""))
    model_anthropic_main: str = field(default_factory=lambda: os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"))
    rate_limit_sleep_seconds: float = 1.0
    fixtures_dir: Path = field(default_factory=lambda: Path("data/fixtures"))


settings = Settings()


def configure_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        datefmt="%H:%M:%S",
    )

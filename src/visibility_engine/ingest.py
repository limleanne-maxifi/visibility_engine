"""Stage 1: Profile ingestion — scrape a website and extract entity data via Claude.

Usage::

    python -m visibility_engine.ingest https://example.com
    python -m visibility_engine.ingest https://example.com --dry-run
    python -m visibility_engine.ingest https://example.com --output data/fixtures/entity_acme.json
"""

from __future__ import annotations

import argparse
import json
import logging
import time
from pathlib import Path
from typing import Any

import anthropic
import requests
from bs4 import BeautifulSoup

from visibility_engine.config import configure_logging, settings

log = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are an expert at extracting structured company information from website text.

Given website content, extract a JSON object with exactly these keys:
- company_name: string (the company's name)
- differentiators: list of strings (unique selling points, up to 10 items)
- services: list of strings (products or services offered, up to 10 items)
- target_clients: list of strings (who they serve, up to 10 items)

Rules:
- Respond with ONLY valid JSON. No markdown fences, no explanation.
- If a field cannot be determined, use an empty list or empty string.
- Keep each list item concise (under 20 words).\
"""

_TEXT_LIMIT = 4000


def fetch_page_text(url: str, timeout: int = 15) -> str:
    """Fetch URL and return visible body text, truncated to _TEXT_LIMIT chars."""
    log.info("Fetching %s", url)
    resp = requests.get(
        url,
        timeout=timeout,
        headers={"User-Agent": "Mozilla/5.0 (compatible; VisibilityEngine/1.0)"},
    )
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()
    text = " ".join(soup.get_text(separator=" ").split())
    if len(text) > _TEXT_LIMIT:
        log.debug("Truncating page text from %d to %d chars", len(text), _TEXT_LIMIT)
        text = text[:_TEXT_LIMIT]
    return text


def extract_entities(page_text: str, url: str) -> dict[str, Any]:
    """Call Claude to extract structured entity data from page text.

    The system prompt is cache-controlled so repeated runs on the same model
    hit the prompt cache after the first call.
    """
    if not settings.anthropic_api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to .env or run with --dry-run."
        )

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    log.info("Calling %s for entity extraction", settings.model_anthropic_main)
    response = client.messages.create(
        model=settings.model_anthropic_main,
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": f"Website URL: {url}\n\nWebsite text:\n{page_text}",
            }
        ],
    )

    raw = response.content[0].text
    log.debug("LLM response (%d chars): %s", len(raw), raw[:300])

    if response.usage.cache_read_input_tokens:
        log.debug("Prompt cache hit: %d tokens", response.usage.cache_read_input_tokens)

    data: dict[str, Any] = json.loads(raw)
    data["source_url"] = url
    return data


def load_fixture(fixture_path: Path) -> dict[str, Any]:
    """Load entity data from a fixture JSON file (used in --dry-run mode)."""
    log.info("Dry-run: loading fixture from %s", fixture_path)
    with fixture_path.open(encoding="utf-8") as f:
        return json.load(f)


def run(
    url: str,
    output_path: Path,
    dry_run: bool = False,
    fixture_path: Path | None = None,
) -> dict[str, Any]:
    """Main ingestion flow. Returns the entity dict and writes it to output_path."""
    if dry_run:
        fp = fixture_path or (settings.fixtures_dir / "entity_acme.json")
        entity = load_fixture(fp)
    else:
        page_text = fetch_page_text(url)
        time.sleep(settings.rate_limit_sleep_seconds)
        entity = extract_entities(page_text, url)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(entity, f, indent=2)
    log.info("Entity data saved to %s", output_path)
    return entity


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Stage 1: scrape a client website and extract entity data."
    )
    p.add_argument("url", help="Website URL to scrape")
    p.add_argument(
        "--output",
        type=Path,
        default=Path("entity.json"),
        help="Output JSON path (default: entity.json)",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Skip API calls; load from fixture instead",
    )
    p.add_argument(
        "--fixture",
        type=Path,
        default=None,
        help="Fixture path for --dry-run (default: data/fixtures/entity_acme.json)",
    )
    return p.parse_args()


if __name__ == "__main__":
    configure_logging()
    args = _parse_args()
    entity = run(
        url=args.url,
        output_path=args.output,
        dry_run=args.dry_run,
        fixture_path=args.fixture,
    )
    log.info(
        "Done. company=%r  differentiators=%d  services=%d  target_clients=%d",
        entity.get("company_name", "?"),
        len(entity.get("differentiators", [])),
        len(entity.get("services", [])),
        len(entity.get("target_clients", [])),
    )

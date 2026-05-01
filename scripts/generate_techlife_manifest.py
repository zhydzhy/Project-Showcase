#!/usr/bin/env python3
"""Generate the Tech & Life Markdown manifest from post front matter."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "techlife"
POSTS_DIR = CONTENT_DIR / "posts"
MANIFEST_PATH = CONTENT_DIR / "index.json"


def normalize_value(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def parse_front_matter(source: str, path: Path) -> dict[str, str]:
    normalized = source.replace("\r\n", "\n").strip()
    if not normalized.startswith("---\n"):
        raise ValueError(f"{path} is missing YAML front matter")

    close_index = normalized.find("\n---", 4)
    if close_index == -1:
        raise ValueError(f"{path} has an unterminated YAML front matter block")

    meta: dict[str, str] = {}
    for line in normalized[4:close_index].splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if ":" not in stripped:
            raise ValueError(f"{path} has an invalid front matter line: {line}")
        key, value = stripped.split(":", 1)
        meta[key.strip().lower()] = normalize_value(value)

    return meta


def load_existing_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        return {}
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def build_post_entry(path: Path) -> dict[str, str]:
    meta = parse_front_matter(path.read_text(encoding="utf-8"), path)
    title = meta.get("title", "").strip()
    date = meta.get("date", "").strip()

    if not title:
        raise ValueError(f"{path} front matter is missing title")
    if not date:
        raise ValueError(f"{path} front matter is missing date")

    return {
        "path": path.relative_to(CONTENT_DIR).as_posix(),
        "title": title,
        "date": date,
        "summary": meta.get("summary", "").strip(),
    }


def main() -> None:
    existing = load_existing_manifest()
    posts = [build_post_entry(path) for path in sorted(POSTS_DIR.glob("*.md"))]
    posts.sort(key=lambda post: (post["date"], post["title"]), reverse=True)

    manifest = {"posts": posts}
    if existing.get("quote"):
        manifest["quote"] = existing["quote"]

    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {MANIFEST_PATH.relative_to(ROOT)} with {len(posts)} posts.")


if __name__ == "__main__":
    main()

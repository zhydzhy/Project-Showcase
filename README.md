# Project Showcase Website
Here I store my static website's source code
Visit my website [here](https://nitro.tj.cn) :)

## Tech & Life workflow

The `techlife.html` page now reads from:

- `content/techlife/index.json`
- `content/techlife/posts/*.md`

Each idea should be its own Markdown file:

```md
---
title: Daily Driving Linux
date: 2026-04-07
summary: One-line summary shown under the title.
---

Write normal Markdown paragraphs here.

- Bullet lists work too
- Headings, blockquotes, links, and code blocks work too
```

`index.json` is generated from post front matter and lists the Markdown files to load. To rebuild it after adding or editing posts:

```bash
python scripts/generate_techlife_manifest.py
```

The page then sorts all loaded posts by `Date:` descending, so the latest idea appears first.

Notes:

- `Tags` were removed from the design and are no longer rendered.
- `title`, `date`, and `summary` are the supported front matter fields.
- Markdown is rendered in the browser with local vendored renderer and sanitizer scripts.

## Obsidian-friendly setup

If you want this to feel like Obsidian publishing instead of website editing:

1. Keep `content/techlife/` inside your Obsidian vault, or symlink this repo path into the vault.
2. Draft each note in `content/techlife/posts/` inside Obsidian.
3. When you add or rename a note, run `python scripts/generate_techlife_manifest.py`.
4. Sync or copy that folder into this repo before publishing.

The page fetches Markdown over HTTP, so local preview should be done with a static server rather than opening `techlife.html` directly as a file.

## ERP snapshot

The Tech & Life page also reads the top-card value from:

- `content/ERP.md`

That file is intended to be generated server-side, not edited manually. Use:

```bash
python3 scripts/update_equity_premium.py
```

It fetches the latest HS300 TTM and ChinaBond 10Y values on the server, computes the spread, and rewrites `content/ERP.md`.

Example cron entry for every 30 minutes:

```cron
*/30 * * * * cd /path/to/Project-Showcase && /usr/bin/python3 scripts/update_equity_premium.py >> /var/log/equity-premium.log 2>&1
```

With Nginx serving this repo as static files, the frontend only needs to request `content/ERP.md`, so there is no browser CORS dependency.

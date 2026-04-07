# Project Showcase Website
Here I store my static website's source code
Visit my website [here](https://nitro.tj.cn) :)

## Tech & Life workflow

The `techlife.html` page now reads from:

- `content/techlife/index.json`
- `content/techlife/posts/*.md`

Each idea should be its own Markdown file:

```md
Title: Daily Driving Linux
Date: 2026-04-07
Summary: One-line summary shown under the title.

Write normal Markdown paragraphs here.

- Bullet lists work too
- Keep it English-only if that is easier
```

`index.json` only does two things:

- stores the featured quote
- lists the Markdown files to load

The page then sorts all loaded posts by `Date:` descending, so the latest idea appears first.

Notes:

- `Tags` were removed from the design and are no longer rendered.
- `Title`, `Date`, and `Summary` are the supported metadata lines.
- Links, bold, italics, inline code, paragraphs, and bullet lists are supported.

## Obsidian-friendly setup

If you want this to feel like Obsidian publishing instead of website editing:

1. Keep `content/techlife/` inside your Obsidian vault, or symlink this repo path into the vault.
2. Draft each note in `content/techlife/posts/` inside Obsidian.
3. When you add a new idea, add its filename to `content/techlife/index.json`.
4. Sync or copy that folder into this repo before publishing.

The page fetches Markdown over HTTP, so local preview should be done with a static server rather than opening `techlife.html` directly as a file.

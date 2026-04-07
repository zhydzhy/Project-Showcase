(() => {
  const langKey = "lang";
  const themeKey = "theme";
  const root = document.documentElement;
  const langButton = document.getElementById("lang-toggle");
  const themeButton = document.getElementById("theme-toggle");
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const systemLang = () =>
    (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";

  const escapeHtml = (value) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");

  const sanitizeUrl = (value) => {
    try {
      const parsed = new URL(value, window.location.href);
      return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? parsed.href : "";
    } catch {
      return "";
    }
  };

  const renderInlineMarkdown = (text) => {
    const tokens = [];
    const stash = (html) => {
      tokens.push(html);
      return `@@TOKEN_${tokens.length - 1}@@`;
    };

    let staged = text;

    staged = staged.replace(/`([^`]+)`/g, (_, code) => stash(`<code>${escapeHtml(code)}</code>`));
    staged = staged.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const safeHref = sanitizeUrl(href.trim());
      const safeLabel = escapeHtml(label.trim());
      return safeHref
        ? stash(`<a href="${safeHref}" target="_blank" rel="noopener">${safeLabel}</a>`)
        : safeLabel;
    });
    staged = escapeHtml(staged);
    staged = staged.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    staged = staged.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    return staged.replace(/@@TOKEN_(\d+)@@/g, (_, index) => tokens[Number(index)] || "");
  };

  const renderBlocks = (markdown) => {
    const lines = markdown.split("\n");
    const blocks = [];
    let paragraph = [];
    let list = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      blocks.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    };

    const flushList = () => {
      if (!list.length) return;
      blocks.push(`<ul class="bullet-list">${list.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushList();
        return;
      }

      if (trimmed.startsWith("- ")) {
        flushParagraph();
        list.push(trimmed.slice(2).trim());
        return;
      }

      flushList();
      paragraph.push(trimmed);
    });

    flushParagraph();
    flushList();

    return blocks.join("");
  };

  const parseTechlifeEntry = (source, fallbackTitle = "") => {
    const normalized = source.replace(/\r\n/g, "\n").trim();
    const lines = normalized.split("\n");
    const meta = {};

    while (lines.length) {
      const line = lines[0].trim();
      const match = line.match(/^([A-Za-z][A-Za-z ]+):\s*(.+)$/);
      if (!match) break;
      meta[match[1].toLowerCase().replace(/\s+/g, "-")] = match[2].trim();
      lines.shift();
    }

    while (lines.length && !lines[0].trim()) lines.shift();

    return {
      title: meta.title || fallbackTitle,
      date: meta.date || "",
      summary: meta.summary || "",
      body: lines.join("\n").trim(),
    };
  };

  const sortEntriesByDate = (entries) => {
    return [...entries].sort((left, right) => {
      const leftTime = left.date ? Date.parse(left.date) : 0;
      const rightTime = right.date ? Date.parse(right.date) : 0;

      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }

      return right.title.localeCompare(left.title);
    });
  };

  const formatArchiveMonth = (value) => {
    const parsed = value ? new Date(`${value}-01T00:00:00`) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const formatDisplayDate = (value) => {
    const parsed = value ? new Date(`${value}T00:00:00`) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  const slugify = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const groupEntriesByMonth = (entries) => {
    const groups = [];
    const map = new Map();

    entries.forEach((entry, index) => {
      const key = entry.date && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) ? entry.date.slice(0, 7) : "undated";
      if (!map.has(key)) {
        const group = {
          key,
          label: key === "undated" ? "Undated" : formatArchiveMonth(key),
          entries: [],
        };
        map.set(key, group);
        groups.push(group);
      }

      map.get(key).entries.push({
        ...entry,
        expanded: index === 0,
        entryId: `entry-${slugify(`${entry.date}-${entry.title}`)}`,
      });
    });

    return groups;
  };

  const renderArchiveGroups = (groups) => {
    return groups.map((group, groupIndex) => `
      <section class="techlife-month reveal ${groupIndex > 0 ? "reveal-delay-1" : ""}">
        <div class="techlife-month-header">
          <h2>${escapeHtml(group.label)}</h2>
          <p class="techlife-month-count">${group.entries.length} ${group.entries.length === 1 ? "idea" : "ideas"}</p>
        </div>
        <div class="techlife-entry-list">
          ${group.entries.map((entry) => {
            const summary = entry.summary ? `<p class="techlife-summary">${escapeHtml(entry.summary)}</p>` : "";
            return `
              <article
                class="essay-card techlife-entry ${entry.expanded ? "is-open" : ""}"
                id="${entry.entryId}"
              >
                <button
                  class="techlife-entry-toggle"
                  type="button"
                  aria-expanded="${entry.expanded ? "true" : "false"}"
                  aria-controls="${entry.entryId}-body"
                >
                  <span class="techlife-entry-title">${escapeHtml(entry.title)}</span>
                  <span class="techlife-entry-date">${escapeHtml(formatDisplayDate(entry.date))}</span>
                </button>
                <div class="techlife-entry-body" id="${entry.entryId}-body" ${entry.expanded ? "" : "hidden"}>
                  ${summary}
                  <div class="stack">
                    ${renderBlocks(entry.body)}
                  </div>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `).join("");
  };

  const renderTechlifePage = async () => {
    const shell = document.querySelector("[data-techlife-root]");
    if (!shell) return;

    try {
      const manifestResponse = await fetch("content/techlife/index.json", { cache: "no-store" });
      if (!manifestResponse.ok) {
        throw new Error(`Manifest request failed with status ${manifestResponse.status}`);
      }

      const manifest = await manifestResponse.json();
      const posts = Array.isArray(manifest.posts) ? manifest.posts : [];
      if (!posts.length) {
        throw new Error("No post files found in content/techlife/index.json");
      }

      const entries = await Promise.all(posts.map(async (path) => {
        const response = await fetch(`content/techlife/${path}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Post request failed for ${path} with status ${response.status}`);
        }

        const fallbackTitle = path.split("/").pop().replace(/\.md$/i, "").replace(/[-_]/g, " ");
        return parseTechlifeEntry(await response.text(), fallbackTitle);
      }));

      const sortedEntries = sortEntriesByDate(entries).filter((entry) => entry.title && entry.body);
      if (!sortedEntries.length) {
        throw new Error("No valid post content found in individual Markdown files");
      }

      const groups = groupEntriesByMonth(sortedEntries);
      const quoteCard = manifest.quote
        ? `
          <aside class="essay-card quote-box reveal reveal-delay-1 techlife-quote">
            <blockquote>${renderInlineMarkdown(manifest.quote)}</blockquote>
          </aside>
        `
        : "";

      shell.innerHTML = `
        <div class="stack">
          ${quoteCard}
        </div>
        <div class="techlife-archive">
          ${renderArchiveGroups(groups)}
        </div>
      `;
    } catch (error) {
      shell.innerHTML = `
        <article class="essay-card techlife-empty">
          <p class="micro">Markdown source unavailable</p>
          <h2>Unable to load notes</h2>
          <p>The page expects <code>content/techlife/index.json</code> and the Markdown post files to be available over HTTP. If you are previewing locally, run a simple static server instead of opening the file directly.</p>
          <p>${escapeHtml(error.message)}</p>
        </article>
      `;
    }
  };

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest(".techlife-entry-toggle");
    if (toggle) {
      const card = toggle.closest(".techlife-entry");
      const body = card?.querySelector(".techlife-entry-body");
      const isOpen = toggle.getAttribute("aria-expanded") === "true";

      toggle.setAttribute("aria-expanded", String(!isOpen));
      if (body) body.hidden = isOpen;
      if (card) card.classList.toggle("is-open", !isOpen);
    }
  });

  const applyThemeLabel = (theme) => {
    if (!themeButton) return;
    const lang = root.dataset.lang || systemLang();
    const label = theme === "dark"
      ? (lang === "zh" ? themeButton.dataset.darkZh : themeButton.dataset.darkEn)
      : (lang === "zh" ? themeButton.dataset.lightZh : themeButton.dataset.lightEn);
    themeButton.textContent = label;
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
  };

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    applyThemeLabel(theme);
  };

  const applyLang = (lang) => {
    root.dataset.lang = lang;
    root.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");

    document.querySelectorAll("[data-i18n-en]").forEach((node) => {
      const next = lang === "zh" ? node.dataset.i18nZh : node.dataset.i18nEn;
      if (next !== undefined) node.textContent = next;
    });

    document.querySelectorAll("[data-i18n-html-en]").forEach((node) => {
      const next = lang === "zh" ? node.dataset.i18nHtmlZh : node.dataset.i18nHtmlEn;
      if (next !== undefined) node.innerHTML = next;
    });

    if (langButton) {
      langButton.textContent = lang === "zh" ? "中文" : "EN";
      langButton.setAttribute("aria-pressed", String(lang === "zh"));
    }

    applyThemeLabel(root.dataset.theme || (media.matches ? "dark" : "light"));
  };

  const storedLang = localStorage.getItem(langKey);
  applyLang(storedLang || systemLang());

  const storedTheme = localStorage.getItem(themeKey);
  applyTheme(storedTheme || (media.matches ? "dark" : "light"));

  media.addEventListener("change", (event) => {
    if (!localStorage.getItem(themeKey)) {
      applyTheme(event.matches ? "dark" : "light");
    }
  });

  if (langButton) {
    langButton.addEventListener("click", () => {
      const next = root.dataset.lang === "zh" ? "en" : "zh";
      localStorage.setItem(langKey, next);
      applyLang(next);
    });
  }

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(themeKey, next);
      applyTheme(next);
    });
  }

  renderTechlifePage();
})();

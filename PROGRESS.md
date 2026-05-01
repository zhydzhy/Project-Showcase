## 2026-04-28 Homepage Claude Redesign
- Problem: The homepage was still built around a cold technical-grid hero with nested boxes, unstable bilingual line breaks, and decorative elements that did not support the portfolio narrative.
- Root cause: The earlier structure optimized for technical signaling instead of a single dominant composition, and the hero relied on automatic text wrapping that broke Chinese phrase integrity and caused English overflow.
- Resolution: Rebuilt `index.html` and `mypage.css` around a warm editorial system guided by the pasted `DESIGN-CLAUDE.md` brief and `frontend-skill`: serif-led hero typography, parchment palette, one folio-style visual plane, simplified support sections, and hard-authored hero line breaks for both languages. Verified with Playwright screenshots in light and dark themes.
- Prevention: Keep bilingual hero copy manually line-broken when using poster-scale type, and validate first-screen composition in a real browser before considering the layout done.
- Related git commit ID: pending (uncommitted)

## 2026-04-28 Homepage Hero Simplification
- Problem: The redesigned homepage hero still used an overdesigned right-side presentation board that felt artificial and visually heavy.
- Root cause: The previous hero tried to force a visual anchor through framed decoration and layered effects instead of letting typography and editorial structure carry the composition.
- Resolution: Replaced the boxed folio hero with a stripped-down ledger layout in `index.html` and `mypage.css`: one short position statement, three operating rows, and two compact supporting facts. Verified the new hero in dark mode for both Chinese and English with Playwright screenshots.
- Prevention: If a hero-side visual needs explanation or ornamental geometry to feel intentional, remove it and fall back to typography, spacing, and section rhythm.
- Related git commit ID: pending (uncommitted)

## 2026-04-28 Homepage Single-Column Hero
- Problem: The right side of the homepage still felt unnecessary after simplification, and the page copy read too generated in places.
- Root cause: The hero kept trying to balance a second column even though the strongest composition was the name, one clear sentence, and two project facts.
- Resolution: Removed the right-side hero column entirely, rebuilt the first screen as a single-column portfolio cover, and tightened homepage copy across the hero, project, method, and profile sections. Verified desktop English, desktop Chinese dark mode, and mobile Chinese renders.
- Prevention: When the supporting column does not add meaning, delete it early and let the main content define the page. Keep homepage copy short enough to scan without explanation.
- Related git commit ID: pending (uncommitted)

## 2026-05-01 Tech & Life Markdown Pipeline
- Problem: Adding Tech & Life notes required hand-editing `index.json`, and the page used a small custom Markdown parser that only handled a narrow syntax subset.
- Root cause: The first static workflow optimized for minimal JavaScript and no tooling, leaving metadata extraction and richer Markdown rendering outside the system.
- Resolution: Migrated posts to YAML front matter, added `scripts/generate_techlife_manifest.py` to generate an enriched manifest, vendored local `marked` and `DOMPurify` browser files, and updated `site.js` to render sanitized Markdown while preserving the accordion archive UI.
- Prevention: Treat `content/techlife/index.json` as generated output and run the manifest script after adding, renaming, or editing post metadata.
- Related git commit ID: pending (uncommitted)

## 2026-05-01 ERP Snapshot Result Centering
- Problem: The ERP snapshot card centered its heading and note, but the large numeric result was visibly left-aligned.
- Root cause: `.techlife-calculator-result` did not define centering behavior for the result value, so the child block aligned to the container start.
- Resolution: Made the result container a full-width centered grid with centered text, keeping the existing typography and card layout intact.
- Prevention: For large standalone dashboard values, center the parent row as well as surrounding text and verify in the browser at the actual served URL.
- Related git commit ID: pending (uncommitted)

## 2026-05-01 ERP Snapshot Label Cleanup
- Problem: The ERP snapshot card included a redundant `Weekday ERP Snapshot` label that repeated the card's purpose without adding useful context.
- Root cause: The earlier card structure used both a micro heading and a meta label, which made the top of the card feel over-labeled.
- Resolution: Removed the redundant meta label from `techlife.html` while keeping the Tony K microcopy, ERP title, result value, and explanatory note.
- Prevention: Keep snapshot cards to one orientation label plus the primary value, and remove secondary labels when they do not change user understanding.
- Related git commit ID: pending (uncommitted)

## 2026-05-01 ERP Snapshot Note Cleanup
- Problem: The ERP card still showed the explanatory note `Weekday market spread snapshot pulled from local Markdown content.`, which was unnecessary on the live page.
- Root cause: The previous cleanup removed the top meta label but left the bottom implementation-oriented note in place.
- Resolution: Removed the snapshot note from `techlife.html`, leaving only the microcopy, ERP title, and numeric value.
- Prevention: Review visible copy for implementation details after UI cleanup so user-facing cards show only meaningful content.
- Related git commit ID: pending (uncommitted)

## 2026-05-01 Homepage Simulation Positioning
- Problem: The homepage hero implied that simulation, factories, and operations were one combined work area.
- Root cause: The hero sentence grouped capstone simulation work with manufacturing operations in a single list.
- Resolution: Rewrote the English and Chinese hero copy to separate manufacturing operations software from simulation capstone work, and clarified the summary as current build versus capstone.
- Prevention: Keep portfolio copy explicit about which work is current, professional, academic, or capstone so project boundaries are not blurred.
- Related git commit ID: pending (uncommitted)

## 2026-05-01 About Page Lean Platform Emphasis
- Problem: The About hero described CARLA and the Lean Activity Management Platform as equal recent tracks, even though CARLA is older capstone/research work.
- Root cause: The profile copy reused a broad systems framing that blurred current professional focus with historical academic work.
- Resolution: Rewrote the About lede, summary, and focus stat to foreground manufacturing operations software and the enterprise Lean platform, while positioning CARLA as earlier capstone/research history.
- Prevention: Keep About-page summaries ordered by recency and relevance, with older academic projects clearly labeled as earlier work.
- Related git commit ID: pending (uncommitted)

## 2026-05-01 Projects Page Lean Platform Repositioning
- Problem: The Projects page presented the Lean Activity Management Platform and CARLA traffic analysis as equal flagship systems.
- Root cause: The page structure still reflected an older portfolio framing before the Lean platform became the clearer current professional focus.
- Resolution: Reworked `projects.html` into separate sections for the lead Lean system, earlier CARLA capstone/research work, and additional builds, updating English and Chinese copy throughout.
- Prevention: Keep project pages organized by current relevance first, then historical/archive work, so older capstone projects do not compete with the main professional story.
- Related git commit ID: pending (uncommitted)

## 2026-05-01 Projects Page Waybar Removal
- Problem: The Projects archive still included the Waybar and Omarchy Linux workflow setup, which no longer fit the tightened project selection.
- Root cause: The additional builds section had not been pruned after the portfolio was refocused around manufacturing operations software and stronger supporting systems.
- Resolution: Removed the Waybar project entry and updated the archive summary so it no longer mentions Linux workflow tooling.
- Prevention: Keep the additional builds list selective and remove hobby/workflow items when they dilute the core portfolio narrative.
- Related git commit ID: pending (uncommitted)

## 2026-05-01 Projects Hero Copy Tightening
- Problem: The Projects hero included an explanatory note about CARLA no longer being the main portfolio story.
- Root cause: The repositioning copy explained the editorial intent directly instead of letting the page hierarchy communicate it.
- Resolution: Removed the CARLA disclaimer from the hero, leaving the lead-project statement to carry the page.
- Prevention: Avoid public-facing copy that explains portfolio strategy; use ordering and section labels to show emphasis.
- Related git commit ID: pending (uncommitted)

## 2026-05-01 Footer Copyright Year Update
- Problem: Site footers still showed `2025 Haotian Zhang. All Rights Reserved.`
- Root cause: The copyright year was duplicated directly in each HTML page instead of being centralized.
- Resolution: Updated the repeated footer copy on the main pages to `2026 Haotian Zhang. All Rights Reserved.` and matched the Chinese i18n string year.
- Prevention: Consider centralizing repeated footer markup or auditing all top-level pages when changing shared site copy.
- Related git commit ID: pending (uncommitted)

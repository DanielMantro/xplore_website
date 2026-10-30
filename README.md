# xplore-mobileapp.de

Marketing site and travel-route blog for the Xplore app. Astro (static) deployed to GitHub Pages.

The handoff brief (sitemap, design system, final copy, launch posts, open items) lives in the separate
`xplore-website-brief` folder. Its `03-content/` and `04-blog/` are the source for every page here.

## Develop
```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # → dist/
```

## Tests
Every commit runs `npm test` (git pre-commit hook, installed by `npm install`). GitHub Actions runs the same suite
on every push and pull request, and only deploys when it passes.

| Command | What it checks |
|---|---|
| `npm run check` | Astro and TypeScript diagnostics |
| `npm run test:unit` | Route helpers, and route content: slugs, images exist, nights add up, months, card catalog (`tests/unit/`) |
| `npm run build` | Production build, including the content schema in `src/content.config.ts` |
| `npm run test:e2e` | Browser tests on the built site at 1440px and 390px (`tests/e2e/`): every page loads with correct head tags and no console errors, no third-party requests, no sideways scrolling, no unloaded or stretched images, internal links and anchors resolve, header menu, trailer click-to-load, feature chips, FAQ, legal table of contents, route post widgets, `noindex` on unreviewed policies, and an axe accessibility scan (WCAG 2.1 AA, serious and critical) |

The UI tests use your installed Google Chrome locally (CI installs Chromium). If you don't have Chrome, run
`npx playwright install chromium` once and set `CI=1`. To bypass the hook in an emergency: `SKIP_SIMPLE_GIT_HOOKS=1 git commit …`.

## Layout
| Path | What |
|---|---|
| `src/content/routes/*.md` | Route posts. Frontmatter follows the brief's `04-blog/_template.md` and is validated in `src/content.config.ts`. One `###` section per stop, in order: the page puts each stop's card beside it, and the map is drawn from the stops' `lat`/`lng`. |
| `src/content/legal/*.md` | Imprint and privacy copy (editor notes stripped). Rendered by `src/layouts/LegalPage.astro`. Both privacy policies are `noindex` until legally reviewed. |
| `src/styles/` | `tokens.css` (design tokens), `site.css` (classes lifted from the design canvas), `fonts.css` (self-hosted Inter). |
| `src/components/` | Header (with get-the-app popover), Footer, DownloadBand, XCard (collectible card), CardBack, PhotoMatchCard, RouteCard, RouteMap, MonthStrip, StoreBadges. |
| `public/assets/` | Brand, card photos, store posters, app screenshots (webp only). |
| `public/CNAME` | Custom domain for GitHub Pages. |

Markdown uses Astro's default processor, which doesn't take remark plugins. For a line break inside a paragraph, end the line with `\`.

## Deploy
Every push to `main` builds and deploys via `.github/workflows/deploy.yml`.
One-time setup: repo **Settings → Pages → Source: GitHub Actions**, then point DNS for `xplore-mobileapp.de` at GitHub Pages
(apex A records 185.199.108–111.153, `www` CNAME → `danielmantro.github.io`) and enable **Enforce HTTPS**.

## Status
| Page | State |
|---|---|
| All pages in the brief's sitemap | Built |
| Waiting on content/legal | Legal review of the privacy policies (then remove `noindex`), Iceland Mar/Apr/Oct months, official route photos for Iceland and Italy |

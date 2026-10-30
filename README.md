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

## Layout
| Path | What |
|---|---|
| `src/content/routes/*.md` | Route posts. Frontmatter follows the brief's `04-blog/_template.md` and is validated in `src/content.config.ts`. |
| `src/content/legal/*.md` | Imprint and privacy copy (editor notes stripped). |
| `src/styles/` | `tokens.css` (design tokens), `site.css` (classes lifted from the design canvas), `fonts.css` (self-hosted Inter). |
| `src/components/` | Header, Footer, DownloadBand, XCard (collectible card), RouteCard, MonthStrip, StoreBadges. |
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
| Features, route posts, `/routes`, imprint, 404, `/get` | Built (first pass) |
| Home | Hero + latest routes + download band. Sections 2–8 to do. |
| Privacy hub, Privacy (app), Privacy (website) | Placeholder (`noindex`) |

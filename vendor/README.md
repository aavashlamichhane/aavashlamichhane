# Community component sources

Only the templates needed for the chosen widgets are included. All three projects are MIT licensed; original license files are retained alongside the source.

| Directory | Upstream | Pinned revision | Local changes |
| --- | --- | --- | --- |
| `summary/` | [vn7n24fzkq/github-profile-summary-cards](https://github.com/vn7n24fzkq/github-profile-summary-cards) | `c5807b007a99953f06e323a463723e52dd4aed9f` | None. Includes the card base, stats, donut, icons, themes, and animation utility. |
| `breakout/` | [cyprieng/github-breakout](https://github.com/cyprieng/github-breakout) | `60c43dca3a1361fbc9fb9bb533b5193296345c4f` | The API-fetch function was removed; `generateSVG` accepts the already-sanitized calendar instead of a username/token. Its response type is exported. The simulation, styling, and SVG renderer are unchanged. |
| `metrics/` | [lowlighter/metrics](https://github.com/lowlighter/metrics/blob/366f8b9dfe3a59656c67d5dcad9950f59c9bc96d/source/plugins/isocalendar/index.mjs) | `366f8b9dfe3a59656c67d5dcad9950f59c9bc96d` | Extracted the full-year isocalendar SVG renderer as `renderIsocalendar(weeks)`. Removed network requests, framework hooks, date-window calculation, and the template-specific negative margin. Kept the isometric geometry and shading; null padding preserves weekday positions without drawing dates outside the verified snapshot. |

The small adapter in `scripts/render-components.ts` maps aggregate counts into these existing components. It adds accessible titles, a matching calendar frame with aggregate captions, and a static first-frame Breakout fallback. Calendar captions say contributions, since the underlying GitHub calendar includes more than commits. No upstream CLI, workflow, repository-fetching logic, or unrelated plugins are included. Updating a revision should include reviewing the source diff and running `npm test`.

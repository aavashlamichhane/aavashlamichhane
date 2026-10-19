# Community component sources

Only the templates needed for the chosen widgets are included. Both projects are MIT licensed; original license files are retained alongside the source.

| Directory | Upstream | Pinned revision | Local changes |
| --- | --- | --- | --- |
| `summary/` | [vn7n24fzkq/github-profile-summary-cards](https://github.com/vn7n24fzkq/github-profile-summary-cards) | `c5807b007a99953f06e323a463723e52dd4aed9f` | None. Includes the card base, stats, donut, icons, themes, and animation utility. |
| `breakout/` | [cyprieng/github-breakout](https://github.com/cyprieng/github-breakout) | `60c43dca3a1361fbc9fb9bb533b5193296345c4f` | The API-fetch function was removed; `generateSVG` accepts the already-sanitized calendar instead of a username/token. Its response type is exported. The simulation, styling, and SVG renderer are unchanged. |

The small adapter in `scripts/render-components.ts` maps aggregate counts into these existing components. It adds accessible titles and exports a static first-frame Breakout fallback. No upstream CLI, workflow, repository-fetching logic, or unrelated plugins are included. Updating a revision should include reviewing the source diff and running `npm test`.

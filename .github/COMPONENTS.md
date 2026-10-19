# README component research

Reviewed on 2026-10-19. The goal is a brief introduction followed by a few interesting widgets, with private activity represented anonymously. The README should have a different identity from both the portfolio and [RbMo7's profile](https://github.com/RbMo7).

The research included [Awesome GitHub Profile README](https://github.com/abhisheknaiidu/awesome-github-profile-readme), [Creative Profile README](https://github.com/coderjojo/creative-profile-readme), [DenverCoder1](https://github.com/DenverCoder1), [vn7n24fzkq](https://github.com/vn7n24fzkq), and the component projects below. The owner subsequently selected Metrics' full-year isometric calendar, while keeping the profile's existing palette, summary cards, and Breakout identity.

## Selected

| Component | Why it fits | Implementation |
| --- | --- | --- |
| [GitHub Profile Summary Cards](https://github.com/vn7n24fzkq/github-profile-summary-cards) — stats | Readable counts in a compact card. A brief entrance animation adds motion without another large panel. | Existing stats template, custom palette, load animation. Five accurate measures, without a synthetic rank. |
| Same project — language donut | A different visual shape balances the stat rows. | Existing donut template and draw animation. Primary-language repository counts include private work; four languages plus Other. |
| [Metrics — full-year isometric calendar](https://github.com/lowlighter/metrics/tree/master/source/plugins/isocalendar) | The owner's selected 3D view of the complete year. | Pinned MIT renderer using the same private-inclusive anonymous calendar as Breakout. Light/dark palettes; active days, daily average, and busiest day; no streak counters. |
| [GitHub Breakout](https://github.com/cyprieng/github-breakout) | The playful signature element. A paddle and ball clear the activity bricks. | Existing MIT-licensed SVG simulation, fed the saved anonymous daily calendar. Coordinated mint/violet colors; static reduced-motion fallback. |

All selected widgets are generated into this repository, so viewers do not depend on an overloaded public badge endpoint. Vendoring the small pure renderers lets private aggregates enter the components without giving third-party services a credential or repository metadata. Source revisions and changes are recorded in [vendor/README.md](../vendor/README.md).

## Other options reviewed

| Project | Interesting element | Decision for this profile |
| --- | --- | --- |
| [lowlighter/metrics — base overview](https://github.com/lowlighter/metrics) | Commits, pull requests, reviews, issues, comments, stars, and repository/community figures. | RbMo7's larger panel uses the base overview. A compact activity-focused subset is a possible future replacement for the existing summary, pending the owner's choice. |
| [Platane/snk](https://github.com/Platane/snk) | Contribution snake with SVG/GIF output. | Good alternative, but already central to the reference profile. |
| [GitHub Profile 3D Contrib](https://github.com/yoshi389111/github-profile-3d-contrib) | An alternative isometric contribution skyline. | Chose the owner's specific Metrics calendar reference instead. |
| [Arcade Contribution Graph Games](https://github.com/abozanona/pacman-contribution-graph) | Pac-Man, Breakout, Galaga, Puzzle Bobble, Bomberman, and Minesweeper variants. | A useful discovery for future swaps. Chose the smaller MIT-licensed GitHub Breakout renderer for this implementation. |
| [Terminal-style GitHub stats](https://github.com/yogeshwaran01/github-stats-terminal-style) | Animated terminal output. | A possible alternate theme; would repeat the header's identity information and add more text here. |
| [GitHub Readme Streak Stats](https://github.com/DenverCoder1/github-readme-streak-stats) | Current and longest streak cards. | Would add another numeric card and emphasize daily streaks over the work itself. Private-aware deployment needs separate consideration. |
| [GitHub Readme Activity Graph](https://github.com/Ashutosh00710/github-readme-activity-graph) | A recent activity line chart. | Useful but redundant beside a year of activity in Breakout. |
| [GitHub Stats Extended](https://github.com/stats-organization/github-stats-extended) | Successor option for broader traditional stats cards. | Worth considering if richer stats become necessary; no extra deployment needed for the chosen pair. |
| [Original GitHub Readme Stats](https://github.com/anuraghazra/github-readme-stats) | Familiar stats and language cards. | Its README now marks the project unmaintained. Avoid making the new profile depend on the old public endpoint. |

The current result has two compact data cards, the selected full-year calendar, and one playful board. Projects, tool badges, employment details, and long biography sections are omitted from the profile. Spotify, snake, activity graph, streak cards, typing SVG, and GitHubCard are not selected.

## Additional stats worth considering

RbMo7's current `github-metrics.svg` has Activity, Community stats, and Repositories sections. Its activity figures include commits, reviewed/opened pull requests, opened issues, and issue comments. This is the core Metrics overview, rather than a separate mysterious widget. The owner's profile could use a smaller activity subset without copying the reference's complete layout.

- [Metrics achievements](https://github.com/lowlighter/metrics/tree/master/source/plugins/achievements): visual milestone badges with thresholds and progress; a possible decorative complement to the numeric cards.
- [Metrics follow-up](https://github.com/lowlighter/metrics/tree/master/source/plugins/followup): open/closed issue and open/merged pull-request ratios, displayed as aggregate charts.

These are suggestions only. Any future detailed activity figures must distinguish credential-accessible breakdowns from anonymous restricted calendar contributions. A private-inclusive calendar does not supply every underlying private event or authorize publishing repository identities.

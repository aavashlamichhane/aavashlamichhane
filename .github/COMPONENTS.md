# README component research

Reviewed on 2026-10-19. The goal is a brief introduction followed by a few interesting widgets, with private activity represented anonymously. The README should have a different identity from both the portfolio and [RbMo7's profile](https://github.com/RbMo7).

The research included [Awesome GitHub Profile README](https://github.com/abhisheknaiidu/awesome-github-profile-readme), [Creative Profile README](https://github.com/coderjojo/creative-profile-readme), [DenverCoder1](https://github.com/DenverCoder1), [vn7n24fzkq](https://github.com/vn7n24fzkq), and the component projects below. RbMo7's metrics, isometric calendar, and snake informed what to avoid repeating.

## Selected

| Component | Why it fits | Implementation |
| --- | --- | --- |
| [GitHub Profile Summary Cards](https://github.com/vn7n24fzkq/github-profile-summary-cards) — stats | Readable counts in a compact card. A brief entrance animation adds motion without another large panel. | Existing stats template, custom palette, load animation. Five accurate measures, without a synthetic rank. |
| Same project — language donut | A different visual shape balances the stat rows. | Existing donut template and draw animation. Primary-language repository counts include private work; four languages plus Other. |
| [GitHub Breakout](https://github.com/cyprieng/github-breakout) | The playful signature element. A paddle and ball clear the activity bricks. | Existing MIT-licensed SVG simulation, fed the saved anonymous daily calendar. Coordinated mint/violet colors; static reduced-motion fallback. |

All selected widgets are generated into this repository, so viewers do not depend on an overloaded public badge endpoint. Vendoring the small pure renderers lets private aggregates enter the components without giving third-party services a credential or repository metadata. Source revisions and changes are recorded in [vendor/README.md](../vendor/README.md).

## Other options reviewed

| Project | Interesting element | Decision for this profile |
| --- | --- | --- |
| [lowlighter/metrics](https://github.com/lowlighter/metrics) | A broad plugin collection, including habits, calendars, and languages. | A large metrics panel would dominate this compact layout and repeat the main reference's direction. |
| [Platane/snk](https://github.com/Platane/snk) | Contribution snake with SVG/GIF output. | Good alternative, but already central to the reference profile. |
| [GitHub Profile 3D Contrib](https://github.com/yoshi389111/github-profile-3d-contrib) | An isometric contribution skyline. | Attractive, but too close to the reference's 3D activity display. |
| [Arcade Contribution Graph Games](https://github.com/abozanona/pacman-contribution-graph) | Pac-Man, Breakout, Galaga, Puzzle Bobble, Bomberman, and Minesweeper variants. | A useful discovery for future swaps. Chose the smaller MIT-licensed GitHub Breakout renderer for this implementation. |
| [Terminal-style GitHub stats](https://github.com/yogeshwaran01/github-stats-terminal-style) | Animated terminal output. | A possible alternate theme; would repeat the header's identity information and add more text here. |
| [GitHub Readme Streak Stats](https://github.com/DenverCoder1/github-readme-streak-stats) | Current and longest streak cards. | Would add another numeric card and emphasize daily streaks over the work itself. Private-aware deployment needs separate consideration. |
| [GitHub Readme Activity Graph](https://github.com/Ashutosh00710/github-readme-activity-graph) | A recent activity line chart. | Useful but redundant beside a year of activity in Breakout. |
| [GitHub Stats Extended](https://github.com/stats-organization/github-stats-extended) | Successor option for broader traditional stats cards. | Worth considering if richer stats become necessary; no extra deployment needed for the chosen pair. |
| [Original GitHub Readme Stats](https://github.com/anuraghazra/github-readme-stats) | Familiar stats and language cards. | Its README now marks the project unmaintained. Avoid making the new profile depend on the old public endpoint. |

The result stops at two compact data cards and one playful board. Projects, tool badges, employment details, and long biography sections are omitted from the profile.

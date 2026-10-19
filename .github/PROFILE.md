# Maintaining this profile

The README keeps the banner, three contact links, a short introduction, two summary cards, and an animated Breakout contribution board. Community renderers supply the widgets; repository-local SVGs display without third-party image services, API keys in URLs, or JavaScript embeds. See [the research shortlist](COMPONENTS.md) and [source attribution](../vendor/README.md).

## Refresh locally

Use Node.js 24 or later and an existing GitHub CLI login belonging to `aavashlamichhane`:

```sh
npm ci --ignore-scripts
npm test
npm run artwork
npm run refresh:private
```

The last command reads the CLI credential into memory, queries GitHub, then renders the components. For a classic PAT or OAuth credential, grant both `repo` and `read:user`: repository access alone does not include private activity in GraphQL's contribution collection. To add the calendar permission to an existing local CLI login, run `gh auth refresh -h github.com -s read:user` and complete GitHub's authorization. Alternatively, provide `PROFILE_STATS_TOKEN` through the environment and use `npm run refresh`. `npm run render` only uses the saved aggregate JSON and makes no network requests. Tokens never go to the component renderers or a third-party badge service.

Edit `README.md` for the intro and links. `scripts/build-assets.mjs` builds the existing banner and contact chips. `scripts/render-components.ts` adapts the sanitized snapshot to the pinned community templates and sets the palette. All graphics use system fonts and support light and dark appearances. Summary card animations respect reduced motion; the Breakout picture selects a static first-frame version for that preference. The cards wrap vertically on narrow screens.

## Anonymous private-work data

`assets/github-stats.json` is an explicit allowlist of counts, dates, language totals, and scope labels. Its daily calendar contains only date, contribution count, and intensity level. The collector does not request repository names, URLs, owners, descriptions, file paths, or contents. Opaque IDs are used in memory to deduplicate repositories and are never saved. API error response bodies are not printed.

Repository and language counts cover owned repositories plus repositories GitHub reports as recently contributed to through commits or pull requests, accessible to the credential. Forks are excluded; duplicates count once. Repositories without a primary language enter the repository total but not the donut. The donut shows the four most common primary languages and groups the remainder as Other. These are repository counts, not bytes of code or proficiency. Team coverage is GitHub's recent-contribution scope, not a lifetime work history.

The contribution calendar and commit count cover the exact range recorded in the snapshot. Private activity is included where GitHub and the credential permit it. These measures are not an estimate of all professional work. The two cards have distinct scopes: repository/language totals describe the accessible repository set; activity describes the past year. Detailed accessible image titles contain the values, date, and scope.

## Automatic updates

**Refresh profile stats** runs daily at 03:23 UTC, manually, and when its implementation changes on `main`. For automatic private refreshes, add the Actions repository secret `PROFILE_STATS_TOKEN` using an owner credential with access to the intended private work. The current single-token setup can use a classic PAT with `repo` and `read:user`, subject to organization policies and SSO requirements. The `repo` scope grants broad repository access even though this collector only reads metadata. The workflow's built-in `GITHUB_TOKEN` cannot read unrelated private repositories. No local credential has been uploaded as a secret.

GitHub documents the additional calendar scope in [ContributionsCollection](https://docs.github.com/en/graphql/reference/users#contributionscollection). The collector checks reported classic/OAuth scopes and rejects a repo-only credential before replacing the snapshot. An earlier snapshot collected without `read:user` is explicitly marked `contributions.coverage: public-only`; private repository and language aggregates have a separate scope and remain valid. Enabling private contribution visibility on the GitHub profile can also affect what unauthenticated viewers see; see [contribution visibility settings](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements).

Without that secret, the last verified private-inclusive snapshot and its date are retained. The workflow can still regenerate the components from that cache. A failed API response or invalid calendar stops the update before replacing the snapshot; render failures prevent a workflow commit. Tests cover pagination, deduplication, removal of private identities, failure handling, cache preservation, offline rendering, and static fallbacks.

Generated component filenames include a hash of their SVG contents. The renderer updates the README's light, dark, and reduced-motion image URLs with those filenames, and the workflow commits the README together with the assets. This prevents GitHub's raw-image cache from continuing to show an older count at an unchanged URL. Old generated versions are removed; unchanged contents keep the same filename.

Commit the README, assets, scripts, package lock, vendor files, and workflow together. Actions must be enabled and permitted to push to the default branch. The displayed assets already exist, so the profile does not depend on a successful first workflow run. Scheduled workflows on inactive public repositories may need re-enabling.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { assets } from './build-assets.mjs';

const username = 'aavashlamichhane';
const date = now => now.toISOString().slice(0, 10);
const integer = value => Number.isInteger(value) && value >= 0;
const sortedLanguages = counts => Object.fromEntries([...counts].sort(([a, n], [b, m]) => m - n || a.localeCompare(b)));

async function github(path, { fetcher, token, body, checkPrivateScopes = false }) {
  const response = await fetcher(`https://api.github.com${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'aavashlamichhane-profile',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20_000),
  });
  // Never print response bodies: GraphQL errors can contain private context.
  if (!response.ok) throw new Error(`GitHub ${response.status}; keeping the existing snapshot.`);
  if (checkPrivateScopes) {
    const header = response.headers.get('x-oauth-scopes');
    const scopes = header?.split(',').map(scope => scope.trim());
    // Classic PATs/OAuth tokens report their scopes. repo permits repository
    // metadata access but read:user is also needed for private calendar activity.
    if (scopes && !scopes.includes('read:user') && !scopes.includes('user')) {
      throw new Error('Private calendar refresh requires read:user in addition to repository access; keeping the existing snapshot.');
    }
  }
  try {
    return await response.json();
  } catch {
    throw new Error('GitHub returned an invalid response; keeping the existing snapshot.');
  }
}

async function graphql(query, variables, options) {
  const result = await github('/graphql', { ...options, body: { query, variables } });
  if (result.errors?.length || result.data?.viewer?.login !== username) {
    throw new Error('Private aggregate query failed or the credential belongs to another account; keeping the existing snapshot.');
  }
  return result.data.viewer;
}

async function privateWork(options) {
  const repos = new Map();
  for (const connection of ['repositories', 'repositoriesContributedTo']) {
    const filters = connection === 'repositories'
      ? 'affiliations: [OWNER], isFork: false'
      : 'includeUserRepositories: false, contributionTypes: [COMMIT, PULL_REQUEST]';
    // Request no repository names, URLs, descriptions, paths, or owners.
    const query = `query($cursor: String) {
      viewer {
        login
        ${connection}(first: 100, after: $cursor, ${filters}) {
          nodes { id isPrivate isFork primaryLanguage { name } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }`;
    let cursor = null;
    do {
      const viewer = await graphql(query, { cursor }, options);
      const page = viewer[connection];
      if (!Array.isArray(page?.nodes) || typeof page.pageInfo?.hasNextPage !== 'boolean') {
        throw new Error('Invalid private repository page; keeping the existing snapshot.');
      }
      for (const repo of page.nodes) {
        if (!repo || typeof repo.id !== 'string' || typeof repo.isFork !== 'boolean' || typeof repo.isPrivate !== 'boolean'
          || (repo.primaryLanguage !== null && typeof repo.primaryLanguage?.name !== 'string')) {
          throw new Error('Invalid private repository metadata; keeping the existing snapshot.');
        }
        if (!repo.isFork) repos.set(repo.id, repo);
      }
      if (!page.pageInfo.hasNextPage) break;
      const next = page.pageInfo.endCursor;
      if (typeof next !== 'string' || !next || next === cursor) {
        throw new Error('Invalid private pagination cursor; keeping the existing snapshot.');
      }
      cursor = next;
    } while (true);
  }
  const viewer = await graphql(`query {
    viewer { login contributionsCollection {
      startedAt endedAt totalCommitContributions
      contributionCalendar { totalContributions weeks {
        contributionDays { date contributionCount contributionLevel }
      } }
    } }
  }`, {}, options);
  const collection = viewer.contributionsCollection;
  if (!integer(collection?.contributionCalendar?.totalContributions) || !integer(collection.totalCommitContributions)
    || !Number.isFinite(Date.parse(collection.startedAt)) || !Number.isFinite(Date.parse(collection.endedAt))) {
    throw new Error('Invalid contribution totals; keeping the existing snapshot.');
  }
  const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
  const weeks = collection.contributionCalendar.weeks;
  if (!Array.isArray(weeks) || !weeks.length || weeks.length > 54) {
    throw new Error('Invalid contribution calendar; keeping the existing snapshot.');
  }
  const calendar = weeks.flatMap(week => {
    if (!Array.isArray(week.contributionDays)) throw new Error('Invalid contribution week; keeping the existing snapshot.');
    return week.contributionDays.map(day => {
      const level = levels.indexOf(day.contributionLevel);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(Date.parse(day.date))
        || !integer(day.contributionCount) || level < 0) {
        throw new Error('Invalid contribution day; keeping the existing snapshot.');
      }
      return { date: day.date, count: day.contributionCount, level };
    });
  });
  if (!calendar.length || new Set(calendar.map(day => day.date)).size !== calendar.length
    || calendar.reduce((sum, day) => sum + day.count, 0) !== collection.contributionCalendar.totalContributions) {
    throw new Error('Contribution calendar totals do not agree; keeping the existing snapshot.');
  }
  const counts = new Map();
  let privateRepositories = 0;
  for (const repo of repos.values()) {
    if (repo.isPrivate) privateRepositories++;
    if (repo.primaryLanguage) {
      const language = repo.primaryLanguage.name;
      counts.set(language, (counts.get(language) ?? 0) + 1);
    }
  }
  // Publish only these explicit aggregates. IDs and other metadata stay in memory.
  return {
    repositories: repos.size,
    privateRepositories,
    contributions: {
      coverage: 'public-and-private',
      total: collection.contributionCalendar.totalContributions,
      commits: collection.totalCommitContributions,
      from: collection.startedAt.slice(0, 10),
      to: collection.endedAt.slice(0, 10),
    },
    languages: sortedLanguages(counts),
    calendar,
  };
}

export async function collectStats({ fetcher = fetch, token = process.env.GITHUB_TOKEN, privateToken = process.env.PROFILE_STATS_TOKEN, now = new Date() } = {}) {
  const options = { fetcher, token: privateToken || token };
  const profile = await github(`/users/${username}`, { ...options, checkPrivateScopes: Boolean(privateToken) });
  if (!integer(profile.followers) || !integer(profile.public_repos)) {
    throw new Error('Invalid profile response; keeping the existing snapshot.');
  }
  if (privateToken) {
    const work = await privateWork(options);
    return {
      username,
      updated: date(now),
      coverage: 'public-and-private',
      repositoryBasis: 'Owned and recently contributed-to non-fork repositories accessible to the credential; team contributions include commits and pull requests.',
      followers: profile.followers,
      languageBasis: 'Repository count per primary language across the same public and private scope; not lines of code or proficiency.',
      ...work,
    };
  }
  const originals = [];
  for (let page = 1; ; page++) {
    const batch = await github(`/users/${username}/repos?type=owner&per_page=100&page=${page}`, options);
    if (!Array.isArray(batch)) throw new Error('Invalid repository response; keeping the existing snapshot.');
    originals.push(...batch.filter(repo => repo.private === false && !repo.fork));
    if (batch.length < 100) break;
  }
  const counts = new Map();
  for (const repo of originals) {
    if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  return {
    username,
    updated: date(now),
    coverage: 'public-only',
    repositoryBasis: 'Owned public non-fork repositories.',
    repositories: originals.length,
    privateRepositories: 0,
    contributions: null,
    calendar: [],
    followers: profile.followers,
    languageBasis: 'Repository count per primary language; not lines of code or proficiency.',
    languages: sortedLanguages(counts),
  };
}

export async function updateStats({ output = assets, privateToken = process.env.PROFILE_STATS_TOKEN, ...options } = {}) {
  let previous;
  try {
    previous = JSON.parse(await readFile(new URL('github-stats.json', output), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const preservePrivate = !privateToken && previous?.coverage === 'public-and-private';
  // Never replace a verified private-inclusive snapshot with narrower public data.
  const data = preservePrivate ? previous : await collectStats({ ...options, privateToken });
  // All requests and validation complete before replacing the saved snapshot.
  await mkdir(output, { recursive: true });
  await writeFile(new URL('github-stats.json', output), `${JSON.stringify(data, null, 2)}\n`);
  console.log(preservePrivate
    ? `Private read credential unavailable; retained verified aggregates from ${data.updated}.`
    : `Updated ${data.coverage} aggregate snapshot (${data.updated}).`);
  return data;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let privateToken = process.env.PROFILE_STATS_TOKEN;
  if (process.argv.includes('--private') && !privateToken) {
    try {
      privateToken = execFileSync('gh', ['auth', 'token'], {
        encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      throw new Error('Private refresh requires an existing GitHub CLI login or PROFILE_STATS_TOKEN.');
    }
    if (!privateToken) throw new Error('No private read credential is available.');
  }
  await updateStats({ privateToken });
}

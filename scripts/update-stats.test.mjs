import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { collectStats, updateStats } from './update-stats.mjs';

const response = data => new Response(JSON.stringify(data), { status: 200 });
const repo = (language, stars = 1, extra = {}) => ({ private: false, fork: false, language, stargazers_count: stars, ...extra });

test('a public-only refresh paginates and labels its narrower coverage accurately', async () => {
  const calls = [];
  const fetcher = async url => {
    calls.push(url);
    if (!url.includes('/repos?')) return response({ public_repos: 103, followers: 15 });
    if (url.endsWith('page=1')) return response(Array.from({ length: 100 }, () => repo('Python')));
    return response([
      repo('TypeScript', 3), repo(null),
      repo('Rust', 999, { private: true }), repo('Java', 999, { fork: true }),
    ]);
  };
  const data = await collectStats({ fetcher, privateToken: null, now: new Date('2026-10-19T00:00:00Z') });
  assert.equal(calls.length, 3);
  assert.equal(data.repositories, 102);
  assert.equal(data.privateRepositories, 0);
  assert.equal(data.coverage, 'public-only');
  assert.equal(data.contributions, null);
  assert.deepEqual(data.languages, { Python: 100, TypeScript: 1 });
  assert.equal(data.updated, '2026-10-19');
});

test('a failed API refresh leaves every existing snapshot file untouched', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'aavash-profile-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = pathToFileURL(dir + sep);
  const savedData = '{"coverage":"public-only"}';
  await writeFile(new URL('github-stats.json', output), savedData);
  await writeFile(new URL('github-stats-dark.svg', output), 'last successful card');
  const fetcher = async url => url.includes('/repos?')
    ? new Response('API rate limit exceeded', { status: 403 })
    : response({ public_repos: 18, followers: 15 });

  await assert.rejects(updateStats({ output, fetcher, privateToken: null }), /GitHub 403/);
  assert.equal(await readFile(new URL('github-stats.json', output), 'utf8'), savedData);
  assert.equal(await readFile(new URL('github-stats-dark.svg', output), 'utf8'), 'last successful card');
  assert.deepEqual((await readdir(dir)).sort(), ['github-stats-dark.svg', 'github-stats.json']);
});

const login = 'aavashlamichhane';
const privateRepo = (id, language, isPrivate = true, extra = {}) => ({
  id, isPrivate, isFork: false,
  primaryLanguage: language ? { name: language } : null,
  name: 'unpublished-project-name',
  url: 'https://github.com/hidden-team/unpublished-project-name',
  description: 'unpublished project description',
  ...extra,
});
const connection = (nodes, hasNextPage = false, endCursor = null) => ({ nodes, pageInfo: { hasNextPage, endCursor } });
const calendar = {
  startedAt: '2025-10-19T00:00:00Z', endedAt: '2026-10-19T00:00:00Z',
  totalCommitContributions: 150,
  contributionCalendar: { totalContributions: 157, weeks: [{ contributionDays: [
    { date: '2026-10-18', contributionCount: 157, contributionLevel: 'FOURTH_QUARTILE', repository: 'unpublished-project-name' },
    { date: '2026-10-19', contributionCount: 0, contributionLevel: 'NONE' },
  ] }] },
};

test('private aggregation paginates, deduplicates team work, and publishes no repository identities', async () => {
  const queries = [];
  const fetcher = async (url, init) => {
    if (!url.endsWith('/graphql')) return response({ public_repos: 18, followers: 15 });
    const { query, variables } = JSON.parse(init.body);
    queries.push(query);
    assert.equal(init.headers.Authorization, 'Bearer test-private-read');
    if (query.includes('contributionsCollection')) return response({ data: { viewer: { login, contributionsCollection: calendar } } });
    if (query.includes('repositoriesContributedTo(')) {
      return response({ data: { viewer: { login, repositoriesContributedTo: connection([
        privateRepo('id-0', 'TypeScript'), // A duplicate from the owned connection.
        privateRepo('team-id', 'C++'),
        privateRepo('fork-id', 'Rust', true, { isFork: true }),
      ]) } } });
    }
    const page = variables.cursor
      ? connection([privateRepo('extra-id', null)])
      : connection(Array.from({ length: 100 }, (_, i) => privateRepo(`id-${i}`, i < 80 ? 'TypeScript' : 'Python', i % 2 === 0)), true, 'opaque-next-page');
    return response({ data: { viewer: { login, repositories: page } } });
  };
  const data = await collectStats({ fetcher, privateToken: 'test-private-read', now: new Date('2026-10-19T00:00:00Z') });
  assert.equal(queries.length, 4);
  assert.equal(data.repositories, 102);
  assert.equal(data.privateRepositories, 52);
  assert.equal(data.coverage, 'public-and-private');
  assert.deepEqual(data.languages, { TypeScript: 80, Python: 20, 'C++': 1 });
  assert.deepEqual(data.contributions, { coverage: 'public-and-private', total: 157, commits: 150, from: '2025-10-19', to: '2026-10-19' });
  assert.deepEqual(data.calendar, [{ date: '2026-10-18', count: 157, level: 4 }, { date: '2026-10-19', count: 0, level: 0 }]);
  const published = JSON.stringify(data);
  for (const secret of ['unpublished-project-name', 'hidden-team', 'unpublished project description', 'team-id', 'id-0', 'opaque-next-page', 'test-private-read']) {
    assert.ok(!published.includes(secret), `Published output contains a private identifier: ${secret}`);
  }
  assert.deepEqual(Object.keys(data).sort(), ['username', 'updated', 'coverage', 'repositoryBasis', 'followers', 'languageBasis', 'repositories', 'privateRepositories', 'contributions', 'languages', 'calendar'].sort());
  assert.ok(queries.every(q => !/nameWithOwner|description|url|owner\s*\{/.test(q)));
});

test('a credential for a different account cannot populate this profile', async () => {
  const fetcher = async url => response(url.endsWith('/graphql')
    ? { data: { viewer: { login: 'another-user' } } }
    : { public_repos: 18, followers: 15 });
  await assert.rejects(collectStats({ fetcher, privateToken: 'test-private-read' }), /another account/);
});

test('a repo-only classic token cannot silently refresh an incomplete private calendar', async () => {
  let requests = 0;
  const fetcher = async () => {
    requests++;
    return new Response(JSON.stringify({ public_repos: 18, followers: 15 }), {
      status: 200, headers: { 'x-oauth-scopes': 'repo, read:org' },
    });
  };
  await assert.rejects(collectStats({ fetcher, privateToken: 'test-private-read' }), /requires read:user/);
  assert.equal(requests, 1);
});

test('partial GraphQL errors are rejected without disclosing their private context', async () => {
  const fetcher = async url => response(url.endsWith('/graphql')
    ? { data: { viewer: { login } }, errors: [{ message: 'denied: hidden-team/unpublished-project-name' }] }
    : { public_repos: 18, followers: 15 });
  await assert.rejects(collectStats({ fetcher, privateToken: 'test-private-read' }), error => {
    assert.doesNotMatch(error.message, /hidden-team|unpublished-project-name/);
    return /Private aggregate query failed/.test(error.message);
  });
});

const savedPrivate = {
  username: login, updated: '2026-10-01', coverage: 'public-and-private',
  repositoryBasis: 'Owned and recent team repositories.', followers: 15,
  languageBasis: 'Primary language per repository.', repositories: 10, privateRepositories: 7,
  contributions: { total: 99, from: '2025-10-01', to: '2026-10-01' },
  languages: { TypeScript: 7, Python: 3 },
};

test('without private credentials, a public workflow retains the verified private snapshot and its date', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'aavash-profile-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = pathToFileURL(dir + sep);
  await writeFile(new URL('github-stats.json', output), JSON.stringify(savedPrivate));
  const data = await updateStats({
    output, privateToken: null, token: 'workflow-token', now: new Date('2026-10-19T00:00:00Z'),
    fetcher: async () => { throw new Error('Must not fetch narrower public data.'); },
  });
  assert.deepEqual(data, savedPrivate);
  assert.deepEqual(JSON.parse(await readFile(new URL('github-stats.json', output), 'utf8')), savedPrivate);
  assert.equal(data.updated, '2026-10-01');
});

test('private API failure cannot overwrite an existing private snapshot or card', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'aavash-profile-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = pathToFileURL(dir + sep);
  const saved = JSON.stringify(savedPrivate);
  await writeFile(new URL('github-stats.json', output), saved);
  await writeFile(new URL('github-stats-dark.svg', output), 'verified private-inclusive card');
  const fetcher = async url => url.endsWith('/graphql')
    ? new Response('denied: hidden-team/unpublished-project-name', { status: 403 })
    : response({ public_repos: 18, followers: 15 });
  await assert.rejects(updateStats({ output, fetcher, privateToken: 'test-private-read' }), /GitHub 403/);
  assert.equal(await readFile(new URL('github-stats.json', output), 'utf8'), saved);
  assert.equal(await readFile(new URL('github-stats-dark.svg', output), 'utf8'), 'verified private-inclusive card');
});

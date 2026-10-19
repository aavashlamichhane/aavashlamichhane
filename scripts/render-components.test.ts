import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { calendarWeeks, renderComponents, versionComponents, retainAssetHistory } from './render-components.ts';
import { renderIsocalendar } from '../vendor/metrics/isocalendar.mjs';

const snapshot = {
  updated: '2026-10-19', coverage: 'public-and-private', repositories: 51, followers: 15,
  languages: { TypeScript: 14, Python: 11, 'C++': 6, JavaScript: 6, HTML: 4, CSS: 1 },
  contributions: { total: 5, commits: 4, from: '2025-10-19', to: '2026-10-19' },
  calendar: [
    { date: '2026-10-17', count: 2, level: 2 as const },
    { date: '2026-10-18', count: 3, level: 3 as const },
    { date: '2026-10-19', count: 0, level: 0 as const },
  ],
  repository: 'hidden-repository', organization: 'hidden-organization', token: 'hidden-credential',
};

test('calendar aligns partial weeks by UTC weekday and discards unrelated fields', () => {
  const weeks = calendarWeeks(snapshot.calendar);
  assert.equal(weeks[0][0], null);
  assert.deepEqual(weeks[0][6], { level: 2, contributionCount: 2 });
  assert.deepEqual(weeks[1][0], { level: 3, contributionCount: 3 });
  assert.deepEqual(weeks[1][1], { level: 0, contributionCount: 0 });
  assert.throws(() => calendarWeeks([]), /verified contribution calendar/);
});

test('image content changes produce fresh README URLs for both themes without rerender churn', () => {
  const readme = '<picture><source srcset="./assets/components/stats-dark.svg"><img src="./assets/components/stats-light.svg"></picture>';
  const initial = { 'stats-dark.svg': '<svg>63</svg>', 'stats-light.svg': '<svg>63 light</svg>' };
  const first = versionComponents(initial, readme);
  assert.deepEqual(versionComponents(initial, first.readme), first);
  const updated = versionComponents({ ...initial, 'stats-dark.svg': '<svg>311</svg>', 'stats-light.svg': '<svg>311 light</svg>' }, first.readme);
  assert.notEqual(updated.readme, first.readme);
  for (const name of Object.keys(first.files)) assert.ok(!updated.readme.includes(name));
  const references = [...updated.readme.matchAll(/\.\/assets\/components\/([^"]+)/g)].map(match => match[1]);
  assert.equal(references.length, 2);
  assert.ok(references.every(name => name in updated.files));
  assert.deepEqual(versionComponents({ ...initial, 'stats-dark.svg': '<svg>311</svg>', 'stats-light.svg': '<svg>311 light</svg>' }, updated.readme), updated);
  assert.throws(() => versionComponents(initial, '<img src="./assets/components/unknown.svg">'), /unknown component/);
});

test('recent image versions survive cached README pages while expired generated images are pruned', () => {
  const old = 'stats-dark.111111111111.svg';
  const recent = 'stats-dark.222222222222.svg';
  const current = 'stats-dark.333333333333.svg';
  const plan = retainAssetHistory([old, recent, current, 'unrelated.svg'], [current], {
    [old]: '2026-10-10', [recent]: '2026-10-18', [current]: '2026-10-01',
  }, '2026-10-19');
  assert.deepEqual(plan.remove, [old]);
  assert.deepEqual(plan.history, { [recent]: '2026-10-18' });
  assert.deepEqual(retainAssetHistory([recent], [recent], {}, '2026-10-19').history, {});
  assert.deepEqual(retainAssetHistory([recent], [], {}, '2026-10-19').history, { [recent]: '2026-10-19' });
});

test('real community renderers work offline and publish no private identities or external resources', async t => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Renderers must not call a remote service.'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const files = await renderComponents(snapshot);
  assert.equal(Object.keys(files).length, 10);
  for (const [name, source] of Object.entries(files)) {
    assert.doesNotMatch(source, /hidden-repository|hidden-organization|hidden-credential/);
    assert.doesNotMatch(source, /NaN|Infinity/);
    const dom = new JSDOM(source, { contentType: 'image/svg+xml' });
    const doc = dom.window.document;
    assert.equal(doc.documentElement.localName, 'svg');
    assert.equal(doc.querySelectorAll('script, foreignObject, image').length, 0);
    for (const el of doc.querySelectorAll('[href]')) assert.ok(el.getAttribute('href')?.startsWith('#'));
    assert.match(doc.querySelector('title')?.textContent ?? '', /2026-10-19/);
    if (name.includes('still')) {
      assert.equal(doc.querySelectorAll('animate, animateTransform, animateMotion').length, 0);
      assert.ok(Number(doc.querySelector('circle')?.getAttribute('cx')) > 0);
    } else if (name.includes('breakout')) {
      assert.ok(doc.querySelectorAll('animate').length > 3);
    } else if (name.includes('isocalendar')) {
      assert.equal(doc.querySelectorAll('animate, animateTransform, animateMotion').length, 0);
      assert.equal(doc.querySelectorAll('path').length, snapshot.calendar.length * 3);
    } else {
      assert.match(source, /prefers-reduced-motion/);
    }
    dom.window.close();
  }
  assert.match(files['languages-dark.svg'], /Other/);
  assert.match(files['stats-dark.svg'], /51 repositories, 5 contributions and 4 commits/);
  assert.deepEqual(await renderComponents(snapshot), files, 'Cached data must render deterministically.');
  assert.match(files['isocalendar-dark.svg'], /2 active days; 1.67 contributions per day; highest daily count 3/);
  await assert.rejects(renderComponents({ ...snapshot, contributions: { ...snapshot.contributions, total: 6 } }), /Calendar total/);
});

test('isometric renderer preserves a full leap-year calendar and partial-week positions without inventing activity', () => {
  const start = Date.parse('2023-10-19T00:00:00Z');
  const days = Array.from({ length: 366 }, (_, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    count: index % 17, level: (index % 5) as 0 | 1 | 2 | 3 | 4,
  }));
  const weeks = calendarWeeks(days);
  const source = renderIsocalendar(weeks.map(week => week.map(day => day && ({ ...day, color: '#7bf0be' }))));
  const dom = new JSDOM(source, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('path').length, 366 * 3, 'Exactly one three-face column per actual calendar day.');
  assert.equal(doc.querySelector('g > g > g')?.getAttribute('transform'), 'translate(-6.8, 10)', 'The first Thursday retains its weekday position.');
  assert.doesNotMatch(source, /NaN|Infinity/);
  dom.window.close();
  const empty = renderIsocalendar([[null, { contributionCount: 0, color: '#16262d' }]]);
  assert.doesNotMatch(empty, /NaN|Infinity/);
  assert.match(empty, /M0,1 1.7,2 1.7,2 0,1 z/);
});

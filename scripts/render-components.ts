import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { createStatsCard } from '../vendor/summary/src/templates/stats-card.ts';
import { createDonutChartCard } from '../vendor/summary/src/templates/donut-chart-card.ts';
import { applyAnimation } from '../vendor/summary/src/utils/animation.ts';
import { Icon } from '../vendor/summary/src/const/icon.ts';
import { Theme } from '../vendor/summary/src/const/theme.ts';
import { generateSVG, type ColorPalette } from '../vendor/breakout/src/svg.ts';
import { assets, themes } from './build-assets.mjs';

type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
type Snapshot = {
  updated: string; coverage: string; repositories: number; followers: number;
  languages: Record<string, number>;
  contributions: { coverage?: string; total: number; commits: number; from: string; to: string };
  calendar: Day[];
};

// Feed community renderers aggregate values only. This module has no API client
// or credential access; all private metadata is discarded by update-stats.mjs.
export function calendarWeeks(calendar: Day[]) {
  if (!calendar?.length) throw new Error('A verified contribution calendar is required before rendering.');
  const days = [...calendar].sort((a, b) => a.date.localeCompare(b.date));
  const start = new Date(`${days[0].date}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const weeks: ({ level: Day['level']; contributionCount: number } | null)[][] = [];
  for (const day of days) {
    const date = new Date(`${day.date}T00:00:00Z`);
    const index = Math.floor((date.getTime() - start.getTime()) / 604_800_000);
    if (!Number.isInteger(index) || index < 0 || index > 53
      || !Number.isInteger(day.count) || day.count < 0 || ![0, 1, 2, 3, 4].includes(day.level)) {
      throw new Error('Invalid calendar snapshot.');
    }
    weeks[index] ??= Array(7).fill(null);
    weeks[index][date.getUTCDay()] = { level: day.level, contributionCount: day.count };
  }
  return weeks;
}

// Retain the first frame's values for readers who request reduced motion.
function accessibleSVG(source: string, description: string, still = false) {
  const dom = new JSDOM(source, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;
  const root = doc.documentElement;
  root.setAttribute('role', 'img');
  root.setAttribute('aria-labelledby', 'description');
  const title = doc.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.id = 'description';
  title.textContent = description;
  root.prepend(title);
  if (still) {
    for (const animation of doc.querySelectorAll('animate, animateTransform, animateMotion')) {
      const attribute = animation.getAttribute('attributeName');
      const first = animation.getAttribute('values')?.split(';')[0];
      if (attribute && first) animation.parentElement?.setAttribute(attribute, first);
      animation.remove();
    }
  }
  const result = root.outerHTML + '\n';
  dom.window.close();
  return result;
}

export async function renderComponents(data: Snapshot) {
  if (!data.contributions || !Number.isInteger(data.contributions.commits)) {
    throw new Error('Refresh the verified contribution snapshot before rendering.');
  }
  const weeks = calendarWeeks(data.calendar);
  const files: Record<string, string> = {};
  const entries = Object.entries(data.languages).sort(([a, n], [b, m]) => m - n || a.localeCompare(b));
  const shown = entries.slice(0, 4);
  if (entries.length > 4) shown.push(['Other', entries.slice(4).reduce((sum, [, n]) => sum + n, 0)]);
  const scope = data.coverage === 'public-and-private' ? 'Public and private work' : 'Public work';
  const activityScope = data.contributions.coverage === 'public-only' ? 'Public activity only'
    : data.contributions.coverage === 'public-and-private' ? 'Public and private activity accessible to the credential'
    : 'Activity coverage not verified';
  const period = `${data.contributions.from} to ${data.contributions.to}`;

  for (const [name, t] of Object.entries(themes)) {
    const theme = new Theme(t.mint, t.text, t.bg, t.line, 1, t.muted, t.mint);
    const rows = [
      [Icon.REPOS, 'Repositories:', data.repositories],
      [Icon.CLOCK, 'Contributions:', data.contributions.total],
      [Icon.COMMIT, 'Commits:', data.contributions.commits],
      [Icon.PEOPLE, 'Followers:', data.followers],
      [Icon.LINK, 'Languages:', entries.length],
    ].map(([icon, label, value], index) => ({ index, icon: String(icon), name: String(label), value: String(value) }));
    const stats = applyAnimation(createStatsCard('GitHub snapshot', rows, theme), 'load', '1.8');
    files[`stats-${name}.svg`] = accessibleSVG(stats,
      `${scope}, as of ${data.updated}: ${data.repositories} repositories, ${data.contributions.total} contributions and ${data.contributions.commits} commits during ${period}, ${data.followers} followers, ${entries.length} primary languages. Calendar scope: ${activityScope}.`);

    const colors = [t.mint, t.violet, '#71b6e2', '#d7a15b', t.muted];
    const languages = shown.map(([language, count], i) => ({ name: language, value: count, color: colors[i] }));
    const donut = applyAnimation(createDonutChartCard('Language mix', languages, theme), 'draw', '1.8');
    files[`languages-${name}.svg`] = accessibleSVG(donut,
      `${scope}. Primary languages by repository count, as of ${data.updated}: ${entries.map(([language, count]) => `${language} ${count}`).join(', ')}. Not lines of code or proficiency.`);

    const palette: ColorPalette = name === 'dark'
      ? ['#16262d', '#164c3a', '#27835a', '#44b980', '#7bf0be']
      : ['#e3ebe6', '#b2dec1', '#72be94', '#3e976c', '#126b4d'];
    const breakout = await generateSVG({ days: weeks, defaultColorPalette: palette }, {
      enableGhostBricks: true, bricksColors: palette, paddleColor: t.violet, ballColor: t.mint,
    });
    const description = `Breakout animation of daily GitHub contributions during ${period}. ${activityScope}; ${data.contributions.total} contributions. Snapshot ${data.updated}.`;
    files[`breakout-${name}.svg`] = accessibleSVG(breakout, description);
    files[`breakout-still-${name}.svg`] = accessibleSVG(breakout, description.replace('animation', 'board'), true);
  }
  return files;
}

export async function saveComponents({ data, output = new URL('components/', assets) }: { data: Snapshot; output?: URL }) {
  const files = await renderComponents(data);
  // Finish every renderer before replacing saved assets.
  await mkdir(output, { recursive: true });
  for (const [name, content] of Object.entries(files)) await writeFile(new URL(name, output), content);
  console.log(`Rendered ${Object.keys(files).length} community component assets from the ${data.updated} snapshot.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await saveComponents({ data: JSON.parse(await readFile(new URL('github-stats.json', assets), 'utf8')) });
}

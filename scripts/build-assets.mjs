import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const themes = {
  dark: { bg: '#0d151c', panel: '#12232c', line: '#29414b', text: '#ecf5f2', muted: '#9bb4b4', mint: '#7bf0be', violet: '#b8a3f5' },
  light: { bg: '#f1f7f3', panel: '#e3efe8', line: '#bed3c7', text: '#183a32', muted: '#4d6a60', mint: '#126b4d', violet: '#7651b3' },
};

export const assets = new URL('../assets/', import.meta.url);
export const xml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
export const svg = (width, height, title, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${xml(title)}</title>${content}</svg>\n`.replace(/[\t ]+$/gm, '');

function diagram(t, x, y) {
  return `<g transform="translate(${x} ${y}) scale(0.78)" fill="none" stroke="${t.line}" stroke-width="1.5">
    <circle cx="170" cy="154" r="133" stroke-dasharray="3 9"/>
    <ellipse cx="170" cy="154" rx="145" ry="76" transform="rotate(-35 170 154)"/>
    <path d="M55 65 170 154 295 224M170 154 284 54M170 154 60 258"/>
    <circle cx="170" cy="154" r="58" fill="${t.panel}" stroke="${t.mint}"/>
    <circle cx="170" cy="154" r="46" stroke-dasharray="2 7"/>
    <text x="170" y="165" fill="${t.mint}" stroke="none" text-anchor="middle" font-family="Consolas,monospace" font-size="32" font-weight="700">A/L</text>
    <rect x="21" y="31" width="70" height="62" rx="15" fill="${t.panel}"/>
    <path d="m45 52-9 10 9 10m22-20 9 10-9 10m-9-23-6 26" stroke="${t.mint}" stroke-linecap="round"/>
    <rect x="251" y="21" width="70" height="62" rx="15" fill="${t.panel}"/>
    <ellipse cx="286" cy="43" rx="17" ry="7" stroke="${t.violet}"/>
    <path d="M269 43v20c0 9 34 9 34 0V43m-34 10c0 9 34 9 34 0" stroke="${t.violet}"/>
    <rect x="260" y="199" width="70" height="62" rx="15" fill="${t.panel}"/>
    <path d="m276 237 12-18 13 16 13-20" stroke="${t.mint}" stroke-linecap="round"/>
    <circle cx="60" cy="258" r="15" fill="${t.panel}" stroke="${t.violet}"/>
    <circle cx="60" cy="258" r="4" fill="${t.violet}" stroke="none"/>
    <circle cx="234" cy="102" r="4" fill="${t.mint}" stroke="none"/>
  </g>`;
}

export function hero(t, compact = false) {
  const width = compact ? 640 : 1200;
  const height = compact ? 360 : 320;
  const x = compact ? 36 : 56;
  return svg(width, height, 'Aavash Lamichhane — Full-Stack Developer & Backend Engineer', `
    <defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="${t.line}" stroke-width="0.6"/></pattern></defs>
    <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="24" fill="${t.bg}" stroke="${t.line}"/>
    ${compact ? '' : `<path d="M800 1h375a24 24 0 0 1 24 24v270a24 24 0 0 1-24 24H800Z" fill="url(#grid)" opacity="0.6"/>`}
    <g font-family="Segoe UI,Arial,sans-serif">
      <rect x="${x}" y="39" width="6" height="17" rx="3" fill="${t.mint}"/>
      <text x="${x + 20}" y="53" fill="${t.muted}" font-size="${compact ? 16 : 14}" letter-spacing="2.5">AAVASH.DEV / ENGINEERING</text>
      ${compact ? `<text x="${x - 3}" y="131" fill="${t.text}" font-size="68" font-weight="750" letter-spacing="-2">Aavash</text>
      <text x="${x - 3}" y="206" fill="${t.text}" font-size="68" font-weight="750" letter-spacing="-2">Lamichhane<tspan fill="${t.mint}">.</tspan></text>` : `<text x="${x - 3}" y="143" fill="${t.text}" font-size="68" font-weight="750" letter-spacing="-2.5">Aavash Lamichhane<tspan fill="${t.mint}">.</tspan></text>`}
      <text x="${x}" y="${compact ? 258 : 192}" fill="${t.mint}" font-size="${compact ? 24 : 25}" font-weight="600">Full-Stack Developer${compact ? '' : ' &amp; Backend Engineer'}</text>
      ${compact ? `<text x="${x}" y="291" fill="${t.muted}" font-size="24">&amp; Backend Engineer</text>` : ''}
      <path d="M${x} ${compact ? 329 : 255}h28" stroke="${t.mint}" stroke-width="2"/>
      <text x="${x + 42}" y="${compact ? 335 : 260}" fill="${t.muted}" font-size="${compact ? 16 : 15}" letter-spacing="1.5">KATHMANDU, NEPAL</text>
    </g>
    ${compact ? '' : diagram(t, 840, 36)}
  `);
}

const badges = [
  ['portfolio', 'aavash.dev ↗', '#7bf0be'], ['linkedin', 'LinkedIn ↗', '#a6c7ff'], ['email', 'Email me ↗', '#c4b5fd'],
];

export async function buildAssets() {
  await mkdir(new URL('badges/', assets), { recursive: true });
  for (const [name, t] of Object.entries(themes)) {
    for (const compact of [false, true]) {
      await writeFile(new URL(`hero-${compact ? 'compact-' : ''}${name}.svg`, assets), hero(t, compact));
    }
  }
  for (const [id, label, color] of badges) {
    const width = Math.ceil(label.length * 7.7 + 36);
    await writeFile(new URL(`badges/${id}.svg`, assets), svg(width, 32, label, `
      <rect x="0.5" y="0.5" width="${width - 1}" height="31" rx="7" fill="#15232d" stroke="#344650"/>
      <rect x="12" y="13" width="6" height="6" rx="2" fill="${color}"/>
      <text x="25" y="21" font-family="Segoe UI,Arial,sans-serif" font-size="13" font-weight="600" fill="#edf4f6">${xml(label)}</text>
    `));
  }
  console.log('Built local header artwork and badges.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildAssets();
}

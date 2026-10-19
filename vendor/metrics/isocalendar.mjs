// Adapted from lowlighter/metrics (MIT), source/plugins/isocalendar/index.mjs
// at 366f8b9dfe3a59656c67d5dcad9950f59c9bc96d.
// Keep the upstream full-year geometry and shading; accept a verified calendar
// instead of fetching account data. Nulls retain weekday positions without
// drawing dates outside the snapshot. Framework hooks and inline margin removed.
export function renderIsocalendar(weeks) {
  const reference = Math.max(0, ...weeks.flatMap(week => week.map(day => day?.contributionCount ?? 0)));
  const size = 6;
  let i = 0, j = 0;
  let svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270">
    ${[1, 2].map(k => `<filter id="brightness${k}"><feComponentTransfer>
      ${[..."RGB"].map(channel => `<feFunc${channel} type="linear" slope="${1 - k * 0.4}"/>`).join("")}
    </feComponentTransfer></filter>`).join("")}
    <g transform="scale(4) translate(12, 0)">`;
  for (const week of weeks) {
    svg += `<g transform="translate(${i * 1.7}, ${i})">`;
    j = 0;
    for (const day of week) {
      if (day) {
        const ratio = (day.contributionCount / reference) || 0;
        svg += `<g transform="translate(${j * -1.7}, ${j + (1 - ratio) * size})">
          <path fill="${day.color}" d="M1.7,2 0,1 1.7,0 3.4,1 z"/>
          <path fill="${day.color}" filter="url(#brightness1)" d="M0,1 1.7,2 1.7,${2 + ratio * size} 0,${1 + ratio * size} z"/>
          <path fill="${day.color}" filter="url(#brightness2)" d="M1.7,2 3.4,1 3.4,${1 + ratio * size} 1.7,${2 + ratio * size} z"/>
        </g>`;
      }
      j++;
    }
    svg += "</g>";
    i++;
  }
  return svg + "</g></svg>";
}

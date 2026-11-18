export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] ?? char);
}

export function highlightRanges(
  source: string,
  ranges: Array<{ start: number; end: number }>,
): string {
  const ordered = ranges
    .map(({ start, end }) => ({
      start: Math.max(0, Math.min(source.length, Math.trunc(start))),
      end: Math.max(0, Math.min(source.length, Math.trunc(end))),
    }))
    .filter(range => range.end > range.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  let html = '';
  let cursor = 0;
  for (const range of ordered) {
    const start = Math.max(cursor, range.start);
    if (range.end <= start) continue;
    html += escapeHtml(source.slice(cursor, start));
    html += `<mark>${escapeHtml(source.slice(start, range.end))}</mark>`;
    cursor = range.end;
  }
  return html + escapeHtml(source.slice(cursor));
}

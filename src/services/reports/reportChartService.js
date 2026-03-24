const formatCurrencyCompact = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });

const escapeXml = (value) =>
  String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const toDataUri = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const buildDailyChart = (payload) => {
  const categories = (payload?.daily?.categories || []).slice(0, 6);
  if (!categories.length) return null;

  const width = 900;
  const height = 340;
  const max = Math.max(...categories.map((c) => Number(c.total || 0)), 1);
  const rowHeight = 38;
  const left = 190;
  const right = 120;
  const top = 42;

  const bars = categories
    .map((item, idx) => {
      const value = Number(item.total || 0);
      const y = top + idx * rowHeight;
      const barWidth = Math.max(2, Math.round((value / max) * (width - left - right)));
      return `
      <text x="16" y="${y + 16}" font-size="13" fill="#374151">${escapeXml(item.category)}</text>
      <rect x="${left}" y="${y}" width="${barWidth}" height="18" rx="5" fill="#2563eb"/>
      <text x="${left + barWidth + 8}" y="${y + 14}" font-size="12" fill="#111827">R$ ${escapeXml(formatCurrencyCompact(value))}</text>`;
    })
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="16" y="26" font-size="18" font-weight="700" fill="#111827">Top categorias de saída (dia)</text>
  ${bars}
</svg>`;

  return {
    title: 'Top categorias de saída',
    alt: 'Gráfico de categorias de saída no relatório diário',
    dataUri: toDataUri(svg),
  };
};

const buildWeeklyChart = (payload) => {
  const days = payload?.weekly?.days || [];
  if (!days.length) return null;

  const width = 940;
  const height = 360;
  const chartTop = 52;
  const chartBottom = 300;
  const left = 70;
  const right = 26;
  const slot = Math.floor((width - left - right) / days.length);

  const max = Math.max(
    ...days.map((d) => Number(d.entries || 0)),
    ...days.map((d) => Number(d.exits || 0)),
    1
  );

  const bars = days
    .map((day, idx) => {
      const entries = Number(day.entries || 0);
      const exits = Number(day.exits || 0);
      const x = left + idx * slot;
      const h1 = Math.round((entries / max) * (chartBottom - chartTop));
      const h2 = Math.round((exits / max) * (chartBottom - chartTop));
      const label = String(day.date || '').slice(5);
      return `
      <rect x="${x + 6}" y="${chartBottom - h1}" width="16" height="${h1}" rx="3" fill="#16a34a" />
      <rect x="${x + 26}" y="${chartBottom - h2}" width="16" height="${h2}" rx="3" fill="#dc2626" />
      <text x="${x + 3}" y="${chartBottom + 18}" font-size="11" fill="#374151">${escapeXml(label)}</text>`;
    })
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="16" y="28" font-size="18" font-weight="700" fill="#111827">Entradas x saídas (7 dias)</text>
  <rect x="16" y="38" width="12" height="12" rx="2" fill="#16a34a"/>
  <text x="34" y="48" font-size="12" fill="#374151">Entradas</text>
  <rect x="108" y="38" width="12" height="12" rx="2" fill="#dc2626"/>
  <text x="126" y="48" font-size="12" fill="#374151">Saídas</text>
  <line x1="${left}" y1="${chartBottom}" x2="${width - right}" y2="${chartBottom}" stroke="#d1d5db" stroke-width="1"/>
  ${bars}
</svg>`;

  return {
    title: 'Entradas x saídas na semana',
    alt: 'Gráfico semanal de entradas e saídas',
    dataUri: toDataUri(svg),
  };
};

const buildReportChart = (payload) => {
  if (payload?.reportType === 'WEEKLY') return buildWeeklyChart(payload);
  return buildDailyChart(payload);
};

module.exports = {
  buildReportChart,
};

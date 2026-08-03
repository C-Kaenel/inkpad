// A small, dependency-free Markdown renderer.
// Supports headings, emphasis, inline code, code fences, links, images,
// blockquotes, ordered / unordered / task lists, tables and horizontal rules.

export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeUrl(url) {
  const trimmed = url.trim();
  return /^(https?:|mailto:|#|\/|\.)/i.test(trimmed) ? trimmed : '#';
}

export function renderInline(text) {
  const codes = [];
  let out = escapeHtml(text).replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `\u0000${codes.length - 1}\u0000`;
  });

  out = out
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => `<img src="${safeUrl(src)}" alt="${alt}">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${safeUrl(href)}" target="_blank" rel="noopener">${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/==([^=]+)==/g, '<mark>$1</mark>')
    .replace(/(^|\s)#([a-z0-9][\w-]*)/gi, '$1<span class="tag">#$2</span>');

  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
}

function renderTable(rows) {
  const split = (row) => row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const head = split(rows[0]);
  const aligns = split(rows[1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : ''));
  const cell = (tag, text, i) => `<${tag}${aligns[i] ? ` style="text-align:${aligns[i]}"` : ''}>${renderInline(text)}</${tag}>`;
  const body = rows.slice(2).map((r) => `<tr>${split(r).map((c, i) => cell('td', c, i)).join('')}</tr>`);
  return `<table><thead><tr>${head.map((c, i) => cell('th', c, i)).join('')}</tr></thead><tbody>${body.join('')}</tbody></table>`;
}

export function renderMarkdown(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;

  const isBlank = (l) => l.trim() === '';

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i++;
      continue;
    }

    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const body = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i++;
      const lang = fence[1] ? ` class="lang-${fence[1]}"` : '';
      html.push(`<pre><code${lang}>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const id = heading[2].toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
      html.push(`<h${level} id="${id}">${renderInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      html.push('<hr>');
      i++;
      continue;
    }

    if (line.startsWith('>')) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith('>')) quote.push(lines[i++].replace(/^>\s?/, ''));
      html.push(`<blockquote>${renderMarkdown(quote.join('\n'))}</blockquote>`);
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) rows.push(lines[i++]);
      html.push(renderTable(rows));
      continue;
    }

    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+/);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[2]);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i++].replace(/^\s*([-*+]|\d+\.)\s+/, ''));
      }

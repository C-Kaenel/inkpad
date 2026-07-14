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


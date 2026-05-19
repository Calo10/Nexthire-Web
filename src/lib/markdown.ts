import { sanitizeHtml } from './sanitizeHtml';

// Very small markdown -> HTML for our public job descriptions.
// Supports: paragraphs, line breaks, **bold**, *italic*, [text](url), simple lists (- item).
export function markdownToSafeHtml(markdown: string): string {
  const raw = String(markdown || '');
  const lines = raw.replace(/\r\n/g, '\n').split('\n');

  const htmlParts: string[] = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }
  };

  const inline = (s: string) => {
    let out = s;
    out = out.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // links
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
    // bold
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // italic
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return out;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    const listMatch = /^-\s+(.+)$/.exec(trimmed);
    if (listMatch) {
      if (!inList) {
        htmlParts.push('<ul>');
        inList = true;
      }
      htmlParts.push(`<li>${inline(listMatch[1])}</li>`);
      continue;
    }

    flushList();
    htmlParts.push(`<p>${inline(trimmed)}</p>`);
  }

  flushList();
  return sanitizeHtml(htmlParts.join(''));
}

export function looksLikeHtml(text: string | null | undefined): boolean {
  const s = String(text || '').trim();
  return /<\/?[a-z][\s\S]*>/i.test(s);
}


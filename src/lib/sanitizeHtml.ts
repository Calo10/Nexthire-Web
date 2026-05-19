// Minimal client-side sanitizer (no external deps).
// Removes script/style tags and dangerous attributes (on* handlers, javascript: urls).
export function sanitizeHtml(input: string): string {
  const html = String(input || '');
  if (!html.trim()) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove scripts/styles/iframes
    doc.querySelectorAll('script,style,iframe,object,embed').forEach((el) => el.remove());

    // Strip dangerous attributes
    doc.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = String(attr.value || '');
        if (name.startsWith('on')) el.removeAttribute(attr.name);
        if (name === 'style') el.removeAttribute(attr.name);
        if ((name === 'href' || name === 'src') && value.trim().toLowerCase().startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML || '';
  } catch {
    // Fallback: escape as plain text
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}


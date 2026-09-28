import DOMPurify from 'dompurify';

/**
 * Text-item content is HTML (see RichText.cs on the API). The server already
 * sanitises it on save; this is the second pass, right before it becomes
 * markup in an agent's browser. The allowlist matches the server's.
 *
 * Items saved before the reader existed are plain text. They carry no tags,
 * so `isHtml` tells the two apart and plain text keeps rendering as it did.
 */

const ALLOWED_TAGS = [
  'p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li', 'blockquote', 'hr', 'a', 'code', 'pre',
  'table', 'thead', 'tbody', 'tr', 'th', 'td'
];
const ALLOWED_ATTR = ['href', 'colspan', 'rowspan'];

// Links in course content open in a new tab and never hand the LMS window
// to the page they open.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const TAG_PATTERN = /<\s*\/?\s*[a-zA-Z!]/;

export function isHtml(value) {
  return typeof value === 'string' && TAG_PATTERN.test(value);
}

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html || '', { ALLOWED_TAGS, ALLOWED_ATTR });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Blank lines separate paragraphs; single line breaks stay inside them. */
export function plainTextToHtml(text) {
  if (!text || !text.trim()) return '';
  return text
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Whatever is stored, as HTML the editor can load. */
export function toEditableHtml(value) {
  return isHtml(value) ? value : plainTextToHtml(value);
}

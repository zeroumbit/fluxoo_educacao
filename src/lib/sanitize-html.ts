import DOMPurify from 'dompurify'

const HTML_ALLOWED_TAGS = [
  'a',
  'b',
  'blockquote',
  'br',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'hr',
  'i',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]

const HTML_ALLOWED_ATTR = [
  'align',
  'class',
  'colspan',
  'href',
  'rel',
  'rowspan',
  'style',
  'target',
]

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: HTML_ALLOWED_TAGS,
    ALLOWED_ATTR: HTML_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
  })
}

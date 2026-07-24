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
  'colspan',
  'href',
  'rel',
  'rowspan',
  'style',
  'target',
]

const SAFE_STYLE_VALUES: Record<string, RegExp> = {
  'text-align': /^(left|right|center|justify)$/i,
  'font-weight': /^(normal|bold|[1-9]00)$/i,
  'font-style': /^(normal|italic)$/i,
  'text-decoration': /^(none|underline|line-through)$/i,
}

function sanitizeStyle(value: string): string {
  return value
    .split(';')
    .map((declaration) => declaration.split(':', 2).map((part) => part.trim()))
    .filter(([property, styleValue]) => {
      const validator = SAFE_STYLE_VALUES[property?.toLowerCase() ?? '']
      return Boolean(validator && styleValue && validator.test(styleValue))
    })
    .map(([property, styleValue]) => `${property!.toLowerCase()}: ${styleValue}`)
    .join('; ')
}

DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName === 'style') {
    const safeStyle = sanitizeStyle(data.attrValue)
    data.attrValue = safeStyle
    data.keepAttr = safeStyle.length > 0
  }
})

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.nodeName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: HTML_ALLOWED_TAGS,
    ALLOWED_ATTR: HTML_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  })
}

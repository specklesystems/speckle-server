import { trim, isNumber } from 'lodash'

/**
 * @typedef {Object} SmartTextEditorSchemaOptions
 * @property {boolean} [multiLine] Whether the document supports multi-line input
 */

/**
 * @typedef {Object} SmartTextEditorOptions
 * @property {string} [placeholder] Placeholder to show, if any
 */

/**
 * Create a TipTap document from basic text
 * @param {string} text
 * @returns {import("@tiptap/core").JSONContent}
 */
export function basicStringToDocument(text) {
  const textNode = { type: 'text', text }
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [textNode] }]
  }
}

/**
 * Check whether a doc is empty
 * @param {import("@tiptap/core").JSONContent} doc
 * @returns
 */
export function isDocEmpty(doc) {
  if (!doc?.content?.length) return true

  for (const content of doc.content) {
    if (content.text) return false
    if (!content.content?.length) continue

    for (const subContent of content.content) {
      if (subContent.text && trim(subContent.text)) return false
      if (subContent.content?.length) return false
    }
  }

  return true
}

/**
 * Create an empty TipTap document
 * @returns {import("@tiptap/core").JSONContent}
 */
export function buildEmptyDocument() {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }]
  }
}

/**
 * Convert document to a basic string without all of the formatting, HTML tags, attributes etc.
 * Useful for previews or text analysis.
 * @param {import("@tiptap/core").JSONContent} doc
 * @param {number | undefined} stopAtLength If set, will stop further parsing when the resulting string length
 * reaches this length. Useful when you're only interested in the first few characters of the document.
 * @returns {string}
 */
export function documentToBasicString(doc, stopAtLength = undefined) {
  const recursiveStringBuilder = (doc, currentString) => {
    if (isNumber(stopAtLength) && currentString.length >= stopAtLength) {
      return currentString
    }

    if (doc.text) {
      currentString += doc.text
    }

    for (const contentDoc of doc.content || []) {
      currentString = recursiveStringBuilder(contentDoc, currentString)
    }

    return currentString
  }

  const result = ''
  return recursiveStringBuilder(doc, result)
}

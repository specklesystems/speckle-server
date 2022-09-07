import { trim, isNumber } from 'lodash'
import { JSONContent } from '@tiptap/core'
import { Optional } from '@/helpers/typeHelpers'

export type SmartTextEditorSchemaOptions = {
  /**
   * Whether the document supports multi-line input
   */
  multiLine?: boolean
}

export type SmartTextEditorOptions = {
  /**
   * Placeholder to show, if any
   */
  placeholder?: string
}

/**
 * Create a TipTap document from basic text
 */
export function basicStringToDocument(text: string): JSONContent {
  const textNode = { type: 'text', text }
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [textNode] }]
  }
}

/**
 * Check whether a doc is empty
 */
export function isDocEmpty(doc: JSONContent | null | undefined): boolean {
  if (!doc) return true
  return trim(documentToBasicString(doc, 1)).length < 1
}

/**
 * Convert document to a basic string without all of the formatting, HTML tags, attributes etc.
 * Useful for previews or text analysis.
 * @param doc
 * @param stopAtLength If set, will stop further parsing when the resulting string length
 * reaches this length. Useful when you're only interested in the first few characters of the document.
 */
export function documentToBasicString(
  doc: JSONContent | null | undefined,
  stopAtLength: Optional<number> = undefined
): string {
  if (!doc) return ''

  const recursiveStringBuilder = (doc: JSONContent, currentString: string) => {
    if (isNumber(stopAtLength) && currentString.length >= stopAtLength) {
      return currentString
    }

    if (doc.text) {
      currentString += doc.text
    }

    // if mention, add it as text as well
    if (doc.type === 'mention' && doc.attrs?.label) {
      currentString += '@' + doc.attrs.label
    }

    for (const contentDoc of doc.content || []) {
      currentString = recursiveStringBuilder(contentDoc, currentString)
    }

    return currentString
  }

  return recursiveStringBuilder(doc, '')
}

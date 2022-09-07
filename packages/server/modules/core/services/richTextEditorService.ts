import { Optional } from '@/modules/shared/helpers/typeHelper'
import { JSONContent } from '@tiptap/core'
import { trim, isString, isObjectLike, get, has, isNumber } from 'lodash'

export type SmartTextEditorValueSchema = {
  version: string
  type: string
  doc?: JSONContent
  blobIds?: string[]
}

/**
 * Used to match URLs that can appear anywhere in a string, not perfect, but crafting a perfect
 * URL regex is quite complex and we only need this for legacy comments
 */
const MID_STRING_URL_RGX = /https?:\/\/\S+/gi

export function isTextEditorDoc(value: unknown): value is JSONContent {
  return !isString(value) && isObjectLike(value) && get(value, 'type') === 'doc'
}

export function isTextEditorValueSchema(
  value: unknown
): value is SmartTextEditorValueSchema {
  return (
    isObjectLike(value) &&
    has(value, 'type') &&
    has(value, 'version') &&
    (has(value, 'doc') || has(value, 'blobIds'))
  )
}

/**
 * Check if value is a schema serialized to string and return the schema object if so or false if not
 */
export function isSerializedTextEditorValueSchema(schemaJson: string) {
  let deserializedSchema = undefined
  try {
    const deserializedJson = JSON.parse(schemaJson)
    if (deserializedJson && isTextEditorValueSchema(deserializedJson)) {
      deserializedSchema = deserializedJson
    }
  } catch (e) {
    // Suppressing serialization errors
  }

  return deserializedSchema || false
}

/**
 * Build a rich text document out of a basic string
 */
export function convertBasicStringToDocument(text: string) {
  // Extract URLs and convert to text with link marks
  const urlMatches = [...text.matchAll(MID_STRING_URL_RGX)].map((m) => m[0])
  const splitTexts = text.split(MID_STRING_URL_RGX)

  const textNodes = []
  for (const textPart of splitTexts) {
    // Build text node, if text part not empty
    if (trim(textPart)) {
      textNodes.push({
        type: 'text',
        text: textPart
      })
    }

    // Get url node to append, if any remaining
    const url = urlMatches.shift()
    if (url) {
      textNodes.push({
        type: 'text',
        text: url,
        marks: [
          {
            attrs: {
              href: url,
              target: '_blank'
            },
            type: 'link'
          }
        ]
      })
    }
  }

  return <JSONContent>{
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: textNodes
      }
    ]
  }
}

/**
 * Generator for walking through content nodes
 */
export function* iterateContentNodes(document: JSONContent): Generator<JSONContent> {
  if (!document) return

  function* recursiveWalker(doc: JSONContent): Generator<JSONContent> {
    yield doc

    for (const contentDoc of doc.content || []) {
      yield* recursiveWalker(contentDoc)
    }
  }

  yield* recursiveWalker(document)
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
 * @param stopAtLength If set, will stop further parsing when the resulting string length
 * reaches this length. Useful when you're only interested in the first few characters of the document.
 *
 * IMPORTANT NOTE!: A duplicate of this exists on the frontend side as well, so if you
 * update this, make sure you update that one as well
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
    if (doc.type === 'mention' && doc.attrs?.label && doc.attrs.id) {
      currentString += '@' + doc.attrs.label
    }

    for (const contentDoc of doc.content || []) {
      currentString = recursiveStringBuilder(contentDoc, currentString)
    }

    return currentString
  }

  return recursiveStringBuilder(doc, '')
}

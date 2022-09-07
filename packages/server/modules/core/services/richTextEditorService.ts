import { JSONContent } from '@tiptap/core'
import { isString, isObjectLike, get, has } from 'lodash'
export {
  isDocEmpty,
  documentToBasicString,
  convertBasicStringToDocument
} from '@speckle/shared/dist/rich-text-editor'

export type SmartTextEditorValueSchema = {
  version: string
  type: string
  doc?: JSONContent
  blobIds?: string[]
}

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

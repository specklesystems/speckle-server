const { SpeckleRichTextParseError } = require('@/modules/shared/errors/base')
const {
  isTextEditorValueSchema,
  isTextEditorDoc,
  convertBasicStringToDocument,
  isSerializedTextEditorValueSchema
} = require('@/modules/core/services/richTextEditorService')
const { isString } = require('lodash')

const COMMENT_SCHEMA_VERSION = '1.0.0'
const COMMENT_SCHEMA_TYPE = 'stream_comment'

/**
 * Build comment.text value from a ProseMirror doc
 * @param {import("@tiptap/core").JSONContent} doc
 * @returns {import('@/modules/core/services/richTextEditorService').SmartTextEditorValueSchema}
 */
function buildCommentTextFromInput(doc) {
  if (!isTextEditorDoc(doc)) {
    throw new SpeckleRichTextParseError('Unexpected comment input doc!')
  }

  return {
    version: COMMENT_SCHEMA_VERSION,
    type: COMMENT_SCHEMA_TYPE,
    doc
  }
}

/**
 * Ensure a comment value pulled from db (string or schema JSON) is formatted to be a text editor schema
 * @param {string|import('@/modules/core/services/richTextEditorService').SmartTextEditorValueSchema} stringOrSchema
 * @returns {import('@/modules/core/services/richTextEditorService').SmartTextEditorValueSchema}
 */
function ensureCommentSchema(stringOrSchema) {
  if (isTextEditorValueSchema(stringOrSchema)) return stringOrSchema
  if (isString(stringOrSchema)) {
    const deserializedSchema = isSerializedTextEditorValueSchema(stringOrSchema)
    if (deserializedSchema) return deserializedSchema

    // A basic string, convert it to the schema format
    const basicTextDoc = convertBasicStringToDocument(stringOrSchema)
    return buildCommentTextFromInput(basicTextDoc)
  }

  throw new SpeckleRichTextParseError('Unexpected comment schema format')
}

module.exports = {
  buildCommentTextFromInput,
  ensureCommentSchema
}

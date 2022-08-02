const { RichTextParseError } = require('@/modules/shared/errors')
const {
  isTextEditorValueSchema,
  isTextEditorDoc,
  convertBasicStringToDocument,
  isSerializedTextEditorValueSchema
} = require('@/modules/core/services/richTextEditorService')
const { isString, uniq } = require('lodash')
const { getBlobs } = require('@/modules/blobstorage/services')
const { InvalidAttachmentsError } = require('@/modules/comments/errors')

const COMMENT_SCHEMA_VERSION = '1.0.0'
const COMMENT_SCHEMA_TYPE = 'stream_comment'

async function validateInputAttachments(streamId, blobIds) {
  blobIds = uniq(blobIds || [])
  if (!blobIds.length) return

  const blobs = await getBlobs({ blobIds, streamId })
  if (!blobs || blobs.length !== blobIds.length) {
    throw new InvalidAttachmentsError('Attempting to attach invalid blobs to comment')
  }
}

/**
 * Build comment.text value from a ProseMirror doc
 * @param {{
 *  doc: import("@tiptap/core").JSONContent | undefined,
 *  blobIds: string[]
 * }} param1
 * @returns {import('@/modules/core/services/richTextEditorService').SmartTextEditorValueSchema}
 */
function buildCommentTextFromInput({ doc = undefined, blobIds = [] }) {
  if (!isTextEditorDoc(doc) && !blobIds.length) {
    throw new RichTextParseError(
      'Attempting to build comment text without document & attachments!'
    )
  }

  return {
    version: COMMENT_SCHEMA_VERSION,
    type: COMMENT_SCHEMA_TYPE,
    doc,
    blobIds
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
    return buildCommentTextFromInput({ doc: basicTextDoc })
  }

  throw new RichTextParseError('Unexpected comment schema format')
}

module.exports = {
  buildCommentTextFromInput,
  ensureCommentSchema,
  validateInputAttachments
}

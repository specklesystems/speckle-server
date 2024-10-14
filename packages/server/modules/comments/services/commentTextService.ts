import { RichTextParseError } from '@/modules/shared/errors'
import {
  isTextEditorValueSchema,
  isTextEditorDoc,
  convertBasicStringToDocument,
  isSerializedTextEditorValueSchema,
  SmartTextEditorValueSchema,
  isDocEmpty
} from '@/modules/core/services/richTextEditorService'
import { isString, uniq } from 'lodash'
import { InvalidAttachmentsError } from '@/modules/comments/errors'
import { JSONContent } from '@tiptap/core'
import { ValidateInputAttachments } from '@/modules/comments/domain/operations'
import { GetBlobs } from '@/modules/blobstorage/domain/operations'

const COMMENT_SCHEMA_VERSION = '1.0.0'
const COMMENT_SCHEMA_TYPE = 'stream_comment'

export const validateInputAttachmentsFactory =
  (deps: { getBlobs: GetBlobs }): ValidateInputAttachments =>
  async (streamId: string, blobIds: string[]) => {
    blobIds = uniq(blobIds || [])
    if (!blobIds.length) return

    const blobs = await deps.getBlobs({ blobIds, streamId })
    if (!blobs || blobs.length !== blobIds.length) {
      throw new InvalidAttachmentsError('Attempting to attach invalid blobs to comment')
    }
  }

/**
 * Build comment.text value from a ProseMirror doc
 */
export function buildCommentTextFromInput({
  doc = undefined,
  blobIds = []
}: Partial<{
  doc: JSONContent | null
  blobIds: string[]
}>) {
  if ((!isTextEditorDoc(doc) || isDocEmpty(doc)) && !blobIds.length) {
    throw new RichTextParseError(
      'Attempting to build comment text without document & attachments!',
      {
        info: {
          doc,
          blobIds
        }
      }
    )
  }

  return <SmartTextEditorValueSchema>{
    version: COMMENT_SCHEMA_VERSION,
    type: COMMENT_SCHEMA_TYPE,
    doc,
    blobIds
  }
}

/**
 * Ensure a comment value pulled from db (string or schema JSON) is formatted to be a text editor schema
 */
export function ensureCommentSchema(
  stringOrSchema: SmartTextEditorValueSchema | string
) {
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

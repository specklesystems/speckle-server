import { RichTextEditor } from '@speckle/shared'
import { CommentContentInput } from '~~/lib/common/generated/gql/graphql'
import { CommentEditorValue } from '~~/lib/viewer/composables/commentManagement'

export function convertCommentEditorValueToInput(
  value: CommentEditorValue
): CommentContentInput {
  return {
    doc: value.doc || null,
    blobIds: value.attachments?.map((a) => a.result.blobId) || []
  }
}

export function isValidCommentContentInput(input: CommentContentInput) {
  if (!input.doc && !(input.blobIds || []).length) return false
  if (input.doc && RichTextEditor.isDocEmpty(input.doc)) return false

  return true
}

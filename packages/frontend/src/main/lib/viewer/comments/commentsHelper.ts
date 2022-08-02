import { UploadFileItem } from '@/main/lib/common/file-upload/fileUploadHelper'
import { SmartTextEditorSchemaOptions } from '@/main/lib/common/text-editor/documentHelper'
import { JSONContent } from '@tiptap/core'

/**
 * Time used for throttling viewer/window resize/etc. updates that trigger comment bubble/thread absolute repositioning
 */
export const VIEWER_UPDATE_THROTTLE_TIME = 50

export const SMART_EDITOR_SCHEMA: SmartTextEditorSchemaOptions = {
  multiLine: false
}

export type CommentEditorValue = {
  doc: JSONContent
  attachments: UploadFileItem[]
}

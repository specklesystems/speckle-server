import { RichTextEditor } from '@speckle/shared'
import { JSONContent } from '@tiptap/core'

const { isDocEmpty, documentToBasicString } = RichTextEditor
export { isDocEmpty, documentToBasicString }

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

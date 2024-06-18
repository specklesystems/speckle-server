import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Underline from '@tiptap/extension-underline'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Link from '@tiptap/extension-link'
import HardBreak from '@tiptap/extension-hard-break'
import History from '@tiptap/extension-history'
import Placeholder from '@tiptap/extension-placeholder'
import { Node, Extension } from '@tiptap/core'
import type { CommandProps, Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import { VALID_HTTP_URL } from '~~/lib/common/helpers/validation'
import type { Nullable } from '@speckle/shared'
import { getMentionExtension } from '~~/lib/core/tiptap/mentionExtension'
import { EmailMention } from '~~/lib/core/tiptap/emailMentionExtension'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    speckleUtilities: {
      addOrUpdateLink: (url: string, title: string) => ReturnType
    }
  }
}

export type TiptapEditorSchemaOptions = {
  /**
   * Whether the document supports multi-line input
   */
  multiLine?: boolean
}

export type TiptapEditorExtensionOptions = {
  /**
   * Placeholder to show, if any
   */
  placeholder?: string

  /**
   * If set, will be used to invite users to this project when the relevant CTA is triggered (e.g. email mentions)
   */
  projectId?: string
}

/**
 * Document node that only supports inline content (no paragraphs or line breaks)
 */
const InlineDoc = Node.create({
  name: 'doc',
  topNode: true,
  content: 'block'
})

export type EnterKeypressTrackerExtensionStorage = {
  editorCallbacks: WeakMap<Editor, Array<() => void>>
  subscribe: (editor: Editor, cb: () => void) => void
  unsubscribe: (editor: Editor, cb: () => void) => void
}

/**
 * Used to track Enter events for submitting on enter etc.
 */
const EnterKeypressTrackerExtension = Extension.create<
  unknown,
  EnterKeypressTrackerExtensionStorage
>({
  name: 'enterKeypressTracker',

  addStorage() {
    return {
      /**
       * Bizarre, but the TipTap extension storage is globally shared between all instances of
       * the extension. This is why I have to store callbacks separately per editor instance
       */
      editorCallbacks: new WeakMap(),
      subscribe(editor, cb) {
        const storage = editor.storage
          .enterKeypressTracker as EnterKeypressTrackerExtensionStorage
        const editorCallbacks = storage.editorCallbacks.get(editor) || []

        const idx = editorCallbacks.indexOf(cb)
        if (idx !== -1) return

        editorCallbacks.push(cb)
        storage.editorCallbacks.set(editor, editorCallbacks)
      },
      unsubscribe(editor, cb) {
        const storage = editor.storage
          .enterKeypressTracker as EnterKeypressTrackerExtensionStorage
        const editorCallbacks = storage.editorCallbacks.get(editor) || []

        const idx = editorCallbacks.indexOf(cb)
        if (idx === -1) return

        editorCallbacks.splice(idx, 1)
        storage.editorCallbacks.set(editor, editorCallbacks)
      }
    }
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { storage, editor } = this
        const callbacks = storage.editorCallbacks.get(editor) || []

        if (!callbacks?.length) return false

        for (const cb of callbacks) {
          cb()
        }

        return true
      }
    }
  }
})

export type SpeckleUtilitiesExtensionStorage = {
  getSelectedText: (editor: Editor) => Nullable<string>
  getLinkText: (editor: Editor) => Nullable<string>
}

/**
 * Various useful utility commands
 */
const UtilitiesExtension = Extension.create<unknown, SpeckleUtilitiesExtensionStorage>({
  name: 'speckleUtilities',

  /**
   * Various utility functions that aren't TipTap commands
   */
  addStorage() {
    return {
      /**
       * Get currently selected text or null if no selection
       */
      getSelectedText: (editor) => {
        const { from, to, empty } = editor.state.selection

        if (empty) {
          return null
        }

        return editor.state.doc.textBetween(from, to, ' ')
      },

      /**
       * Get full text of the selected link node
       * @param {import('@tiptap/core').Editor} editor
       */
      getLinkText: (editor) => {
        const { $from: pos } = editor.state.selection
        if (!pos) return null

        // Check if link mark is inclusive, as this changes the child idx resolution algo
        const isLinkInclusive = editor.schema.mark('link').type.spec.inclusive || false

        // Resolve link node's index using parent
        let parentChildIdx = pos.index()
        if (isLinkInclusive) {
          // Since link is inclusive, if textOffset is 0 (the cursor is at the end of the link) we need
          // to decrease index by 1 to get the actual link, not the next node
          // Except if the cursor is at the very beginning (which is why we clamp it)
          parentChildIdx = Math.max(0, pos.textOffset ? pos.index() : pos.index() - 1)
        }

        const parent = pos.parent
        const textNode = parent.child(parentChildIdx)

        // Check if actually a link
        if (!textNode.marks.find((m) => m.type.name === 'link')) return null

        return textNode.textContent
      }
    }
  },

  /**
   * Only add "commands" here (they should mutate the state of the editor and be transactional)
   */
  addCommands() {
    return {
      /**
       * Insert new link or update the one currently selected with a new title & URL
       */
      addOrUpdateLink: (url: string, title: string) => (cmdProps: CommandProps) => {
        const { chain } = cmdProps
        const cmdChain = chain().focus()

        // Change selection to entire link, if part of it is selected
        cmdChain.extendMarkRange('link')

        // Insert (& replace old, if selection isnt empty) new title
        cmdChain.insertContent(title)

        // Select newly created text
        cmdChain.command((cmdProps) => {
          const { tr } = cmdProps

          // Select the newly added text
          const selection = tr.selection
          const $anchor = tr.selection.$anchor // insertContent() moves selection to the end of the new text
          const $head = tr.doc.resolve(selection.anchor - title.length)

          const newSelection = new TextSelection($anchor, $head)
          tr.setSelection(newSelection)
          return true
        })

        // Set it to be a link
        cmdChain.setLink({ href: url })

        // Collapse selection to point to the end of the link
        cmdChain.command((cmdProps) => {
          const { tr } = cmdProps

          const newSelection = new TextSelection(tr.selection.$to)
          tr.setSelection(newSelection)
          return true
        })

        // Run chain
        return cmdChain.run()
      }
    }
  }
})

/**
 * Get TipTap editor extensions that should be loaded in the editor
 */
export function getEditorExtensions(
  schemaOptions?: TiptapEditorSchemaOptions,
  extensionOptions?: TiptapEditorExtensionOptions
) {
  const { multiLine = true } = schemaOptions || {}
  const { placeholder, projectId } = extensionOptions || {}
  return [
    ...(multiLine ? [Document] : [InlineDoc, EnterKeypressTrackerExtension]),
    HardBreak,
    UtilitiesExtension,
    Text,
    Paragraph,
    Bold,
    Underline,
    Italic,
    Strike,
    Link.configure({
      // Only allow http protocol links (no JS)
      validate: (href) => VALID_HTTP_URL.test(href),
      // Open on click would be too annoying during editing
      openOnClick: false,
      // Autolink off cause otherwise it's impossible to end the link
      autolink: false
    }),
    getMentionExtension(),
    EmailMention.configure({
      projectId
    }),
    History,
    ...(placeholder ? [Placeholder.configure({ placeholder })] : [])
  ]
}

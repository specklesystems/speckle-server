import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Underline from '@tiptap/extension-underline'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Link from '@tiptap/extension-link'
import HardBreak from '@tiptap/extension-hard-break'
import Mention from '@tiptap/extension-mention'
import History from '@tiptap/extension-history'
import Placeholder from '@tiptap/extension-placeholder'

import { Node, Extension } from '@tiptap/core'
import { TextSelection } from 'prosemirror-state'
import { VALID_HTTP_URL } from '@/main/lib/common/vuetify/validators'

import { suggestion } from '@/main/lib/common/text-editor/mentionSuggestion'

/**
 * Document node that only supports inline content (no paragraphs or line breaks)
 */
export const InlineDoc = Node.create({
  name: 'doc',
  topNode: true,
  content: 'block'
})

/**
 * Used to track Enter events for submitting on enter etc.
 */
export const EnterKeypressTrackerExtension = Extension.create({
  name: 'enterKeypressTracker',

  addStorage() {
    return {
      /**
       * Bizarre, but the TipTap extension storage is globally shared between all instances of
       * the extension. This is why I have to store callbacks separately per editor instance
       */
      editorCallbacks: new WeakMap(),
      subscribe(editor, cb) {
        const storage = editor.storage.enterKeypressTracker
        const editorCallbacks = storage.editorCallbacks.get(editor) || []

        const idx = editorCallbacks.indexOf(cb)
        if (idx !== -1) return

        editorCallbacks.push(cb)
        storage.editorCallbacks.set(editor, editorCallbacks)
      },
      unsubscribe(editor, cb) {
        const storage = editor.storage.enterKeypressTracker
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

/**
 * Various useful utility commands
 */
export const UtilitiesExtension = Extension.create({
  name: 'speckleUtilities',

  /**
   * Various utility functions that aren't TipTap commands
   */
  addStorage() {
    return {
      /**
       * Get currently selected text or null if no selection
       * @param {import('@tiptap/core').Editor} editor
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
       * @param {string} url
       * @param {string} title
       */
      addOrUpdateLink: (url, title) => (cmdProps) => {
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
        })

        // Set it to be a link
        cmdChain.setLink({ href: url })

        // Collapse selection to point to the end of the link
        cmdChain.command((cmdProps) => {
          const { tr } = cmdProps

          const newSelection = new TextSelection(tr.selection.$to)
          tr.setSelection(newSelection)
        })

        // Run chain
        return cmdChain.run()
      }
    }
  }
})

/**
 * Get TipTap editor extensions that should be loaded in the editor
 * @param {import('@/main/lib/common/text-editor/documentHelper').SmartTextEditorSchemaOptions}
 * @param {import('@/main/lib/common/text-editor/documentHelper').SmartTextEditorOptions}
 */
export function getEditorExtensions({ multiLine = true } = {}, { placeholder } = {}) {
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
    Mention.configure({
      suggestion,
      HTMLAttributes: {
        class: 'editor-mention'
      }
    }),
    History,
    ...(placeholder ? [Placeholder.configure({ placeholder })] : [])
  ]
}

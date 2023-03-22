/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Node, mergeAttributes } from '@tiptap/core'
import { EmailSuggestion } from '~~/lib/core/tiptap/email-mention/suggestion'

export type EmailMentionOptions = {}

export const EmailMention = Node.create<EmailMentionOptions>({
  name: 'emailMention',

  addOptions() {
    return {}
  },

  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      email: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-email'),
        renderHTML: (attributes) => {
          if (!attributes.email) return {}
          return { 'data-email': attributes.email }
        }
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`
      }
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': this.name, class: 'editor-email-mention' },
        HTMLAttributes
      ),
      node.attrs.email
    ]
  },

  renderText({ node }) {
    return node.attrs.email
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isMention = false
          const { selection } = state
          const { empty, anchor } = selection

          if (!empty) {
            return false
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isMention = true
              tr.insertText('', pos, pos + node.nodeSize)
              return false
            }
          })

          return isMention
        })
    }
  },

  addProseMirrorPlugins() {
    return [
      EmailSuggestion({
        editor: this.editor,
        nodeName: this.name
      })
    ]
  }
})

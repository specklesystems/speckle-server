import { mergeAttributes, Node } from '@tiptap/core'

/**
 * This has since been removed, but we need it in place for backwards compatibility, otherwise
 * older comments that use this node type will break and not render.
 *
 * So the following extension just renders those node types as plain text, and that's it
 */
export const LegacyEmailMention = Node.create({
  name: 'emailMention',
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
          return { 'data-email': attributes.email as string }
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
    return node.attrs.email as string
  }
})

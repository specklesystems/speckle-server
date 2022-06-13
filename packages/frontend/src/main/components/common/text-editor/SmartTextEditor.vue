<template>
  <component
    :is="readOnly ? 'div' : 'VCard'"
    :class="['smart-text-editor', readOnly ? 'smart-text-editor--read-only' : '']"
  >
    <component
      :is="readOnly ? 'div' : 'VCardText'"
      class="d-flex flex-column smart-text-editor__inner"
    >
      <smart-text-editor-toolbar
        v-if="!hideToolbar && !readOnly"
        :formats.sync="formatsValue"
        :link="linkValue"
        :style="{ minWidth: minWidth ? baseWidth : undefined }"
        @link="onLinkClick"
        @unlink="onUnlinkClick"
      />
      <editor-content
        class="simple-scrollbar"
        :editor="editor"
        :style="maxHeight ? `max-height: ${maxHeight}; overflow-y: auto;` : ''"
        @click.native="onEditorContentClick"
      />
      <div v-if="$slots.actions && !readOnly">
        <slot name="actions" />
      </div>
      <smart-text-editor-link-dialog
        v-if="!readOnly"
        v-model="linkDialogData"
        @submit="onLinkDialogSubmit"
      />
    </component>
  </component>
</template>
<script>
import { Editor, EditorContent } from '@tiptap/vue-2'
import SmartTextEditorToolbar from '@/main/components/common/text-editor/SmartTextEditorToolbar.vue'
import {
  FormattingMarks,
  LinkOptions
} from '@/main/lib/common/text-editor/formattingHelpers'
import { getEditorExtensions } from '@/main/lib/common/text-editor/tipTapExtensions'
import SmartTextEditorLinkDialog from '@/main/components/common/text-editor/SmartTextEditorLinkDialog.vue'
import { VCard, VCardText } from 'vuetify/lib'

export default {
  name: 'SmartTextEditor',
  components: {
    SmartTextEditorToolbar,
    EditorContent,
    SmartTextEditorLinkDialog,
    VCard,
    VCardText
  },
  props: {
    /**
     * TipTap/ProseMirror JSON content representation
     */
    value: {
      type: Object,
      default: undefined
    },
    /**
     * Control the document schema
     * @type {import('@/main/lib/common/text-editor/documentHelper').SmartTextEditorSchemaOptions}
     */
    schemaOptions: {
      type: Object,
      required: false,
      default: () => ({})
    },
    /**
     * If set, will limit height and show a scrollbar
     */
    maxHeight: {
      type: String,
      default: null
    },
    /**
     * If true, will limit min width so that the toolbar can render in full
     */
    minWidth: {
      type: Boolean,
      default: false
    },
    autofocus: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: undefined
    },
    hideToolbar: {
      type: Boolean,
      default: false
    },
    /**
     * If true, editor is only used for outputting/rendering documents
     */
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    editor: null,
    linkDialogData: null,
    baseWidth: '250px'
  }),
  computed: {
    isMultiLine() {
      return !!this.schemaOptions?.multiLine
    },
    isEditable() {
      return !this.disabled && !this.readOnly
    },
    formatsValue: {
      get() {
        if (!this.editor) return {}

        // Read enabled formatting marks from editor
        const format = {}
        for (const mark of Object.values(FormattingMarks)) {
          format[mark] = this.editor.isActive(mark)
        }

        return format
      },
      set(newVal) {
        // Apply formatting marks
        const command = this.editor.chain().focus()
        for (const [mark, isEnabled] of Object.entries(newVal)) {
          if (isEnabled) {
            command.setMark(mark)
          } else {
            command.unsetMark(mark)
          }
        }
        command.run()
      }
    },
    linkValue() {
      if (!this.editor) return {}

      // Read link button states from editor
      const isLinkActive = this.editor.isActive('link')
      const link = {
        [LinkOptions.Link]: isLinkActive,
        [LinkOptions.Unlink]: isLinkActive
      }

      return link
    }
  },
  watch: {
    value(newVal) {
      const isSame = JSON.stringify(this.getData()) === JSON.stringify(newVal)
      if (isSame) return

      this.editor.commands.setContent(newVal || '')
    },
    isEditable(newVal) {
      this.editor.setEditable(newVal)
    },
    isMultiline(newVal) {
      if (this.readOnly) return

      if (newVal) {
        this.editor.storage.enterKeypressTracker.unsubscribe(this.editor, this.onEnter)
      } else {
        this.editor.storage.enterKeypressTracker.subscribe(this.editor, this.onEnter)
      }
    }
  },
  mounted() {
    this.editor = new Editor({
      content: this.value || undefined,
      autofocus: this.autofocus,
      editable: this.isEditable,
      extensions: getEditorExtensions(this.schemaOptions || {}, {
        placeholder: this.placeholder
      }),
      onUpdate: () => {
        const data = this.getData()
        if (!data || Object.keys(data).length < 1) return

        this.$emit('input', data)
      }
    })

    if (!this.readOnly && !this.isMultiLine) {
      this.editor.storage.enterKeypressTracker.subscribe(this.editor, this.onEnter)
    }
  },
  beforeDestroy() {
    this.editor.destroy()
    this.editor.storage.enterKeypressTracker.unsubscribe(this.editor, this.onEnter)
  },
  methods: {
    onEditorContentClick(e) {
      /**
       * @type {HTMLElement|undefined}
       */
      const closestSelectorTarget = e.target.closest('.editor-mention')
      if (closestSelectorTarget) {
        this.onMentionClick(closestSelectorTarget.dataset.id, e)
        e.stopPropagation()
        return
      }
    },
    /**
     * @param {string} userId
     * @param {MouseEvent} e
     */
    onMentionClick(userId, e) {
      if (!this.readOnly) return

      const url = `/profile/${userId}`
      const isMetaKey = e.metaKey || e.ctrlKey
      if (isMetaKey) {
        window.open(url, '_blank')
      } else {
        location.href = url
      }
    },
    getData() {
      return this.editor.getJSON()
    },
    onUnlinkClick() {
      this.editor.chain().focus().unsetLink().run()
    },
    onLinkClick(e) {
      // https://vuetifyjs.com/en/components/dialogs/#without-activator
      e.stopPropagation()

      // Get currently selected link data, if any
      const { href } = this.editor.getAttributes('link') || {}

      // If cursor is on a link, use its full title, otherwise just get selected text
      const selectedText = this.editor.isActive('link')
        ? this.editor.storage.speckleUtilities.getLinkText(this.editor) || ''
        : this.editor.storage.speckleUtilities.getSelectedText(this.editor) || ''

      this.linkDialogData = {
        url: href,
        title: selectedText
      }
    },
    /**
     * Add/update link with new title & URL
     */
    onLinkDialogSubmit({ title, url }) {
      this.editor.commands.addOrUpdateLink(url, title)
    },
    onEnter() {
      // Multiline editors don't support enter-on-submit, and it would be unintuitive anyway
      if (this.isMultiline || this.readOnly) return

      this.$emit('submit', { data: this.getData() })
    }
  }
}
</script>
<style lang="scss">
.ProseMirror-focused {
  outline: none;
}

.ProseMirror {
  p:last-of-type {
    margin-bottom: 0px;
  }

  p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    pointer-events: none;
    height: 0;
  }

  .editor-mention {
    border-style: solid;
    border-width: 1px;
    border-radius: 0.4rem;
    padding: 0.1rem 0.3rem;
    box-decoration-break: clone;
  }
}

.theme--dark .ProseMirror {
  .editor-mention {
    border-color: white;
  }

  p.is-editor-empty:first-child::before {
    color: #757575; // gray darken-1
  }
}
.theme--light .ProseMirror {
  .editor-mention {
    border-color: #000;
  }

  p.is-editor-empty:first-child::before {
    color: #9e9e9e; // gray
  }
}

.smart-text-editor {
  &--read-only {
    word-break: break-word;

    background-color: unset !important;
    box-shadow: unset !important;

    .smart-text-editor__inner {
      padding: 0;
    }

    .editor-mention {
      cursor: pointer;
    }
  }
}
</style>

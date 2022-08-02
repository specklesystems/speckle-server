<template>
  <div class="d-flex flex-wrap mb-1">
    <!-- Text formatting settings -->
    <div class="d-flex">
      <smart-text-editor-toolbar-btn v-model="boldValue">
        <v-icon small>mdi-format-bold</v-icon>
      </smart-text-editor-toolbar-btn>
      <smart-text-editor-toolbar-btn v-model="italicValue">
        <v-icon small>mdi-format-italic</v-icon>
      </smart-text-editor-toolbar-btn>
      <smart-text-editor-toolbar-btn v-model="underlineValue">
        <v-icon small>mdi-format-underline</v-icon>
      </smart-text-editor-toolbar-btn>
      <smart-text-editor-toolbar-btn v-model="strikeValue">
        <v-icon small>mdi-format-strikethrough</v-icon>
      </smart-text-editor-toolbar-btn>
    </div>
    <!-- Link/unlink -->
    <div class="d-flex ml-2">
      <smart-text-editor-toolbar-btn
        :value="link[LinkOptions.Link] || false"
        @click="onLinkClick"
      >
        <v-icon small>mdi-link</v-icon>
      </smart-text-editor-toolbar-btn>
      <smart-text-editor-toolbar-btn
        :value="link[LinkOptions.Unlink] || false"
        @click="onUnlinkClick"
      >
        <v-icon small>mdi-link-off</v-icon>
      </smart-text-editor-toolbar-btn>
    </div>
  </div>
</template>
<script>
import {
  FormattingMarks,
  LinkOptions
} from '@/main/lib/common/text-editor/formattingHelpers'
import SmartTextEditorToolbarBtn from '@/main/components/common/text-editor/SmartTextEditorToolbarBtn.vue'
import { reduce } from 'lodash'

export default {
  name: 'SmartTextEditorToolbar',
  components: {
    SmartTextEditorToolbarBtn
  },
  props: {
    formats: {
      type: Object,
      default: () => ({})
    },
    link: {
      type: Object,
      default: () => ({})
    }
  },
  data: () => ({ FormattingMarks, LinkOptions }),
  computed: {
    // boldValue, italicValue... etc.
    ...reduce(
      Object.values(FormattingMarks),
      (result, mark) => {
        result[mark + 'Value'] = {
          get() {
            return this.realFormats[mark] || false
          },
          set(newVal) {
            this.setNewFormatValue(mark, newVal)
          }
        }
        return result
      },
      {}
    ),
    realFormats: {
      get() {
        return this.formats
      },
      set(newVal) {
        this.$emit('update:formats', newVal)
      }
    }
  },
  mounted() {
    /**
     * @param {KeyboardEvent} event
     */
    this.keydownListener = (event) => {
      // Track Cmd/Ctrl+K for link modal
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        this.$emit('link', event)
      }
    }
    document.addEventListener('keydown', this.keydownListener)
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keydownListener)
  },
  methods: {
    onLinkClick(e) {
      this.$emit('link', e)
    },
    onUnlinkClick(e) {
      if (!this.link[LinkOptions.Unlink]) return
      this.$emit('unlink', e)
    },

    setNewFormatValue(format, val) {
      const currentFormats = this.realFormats
      this.realFormats = {
        ...currentFormats,
        [format]: val
      }
    },
    setNewLinkValue(linkOpt, val) {
      const currentLink = this.realLink
      this.realLink = {
        ...currentLink,
        [linkOpt]: val
      }
    }
  }
}
</script>

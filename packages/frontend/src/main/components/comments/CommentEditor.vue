<template>
  <smart-text-editor
    v-model="realValue"
    autofocus
    min-width
    :placeholder="placeholder"
    :schema-options="editorSchemaOptions"
    :disabled="disabled"
    :hide-toolbar="addingComment"
    @submit="onSubmit"
  />
</template>
<script>
import SmartTextEditor from '@/main/components/common/text-editor/SmartTextEditor.vue'
import { SMART_EDITOR_SCHEMA } from '@/main/lib/viewer/comments/commentsHelper'

export default {
  name: 'CommentEditor',
  components: {
    SmartTextEditor
  },
  props: {
    value: {
      type: Object,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    addingComment: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      editorSchemaOptions: SMART_EDITOR_SCHEMA
    }
  },
  computed: {
    realValue: {
      get() {
        return this.value
      },
      set(newVal) {
        this.$emit('input', newVal)
      }
    },
    placeholder() {
      return this.addingComment
        ? 'Your comment... (press enter to send)'
        : 'Reply... (press enter to send)'
    }
  },
  methods: {
    onSubmit(e) {
      this.$emit('submit', e)
    }
  }
}
</script>

<template>
  <!-- eslint-disable vuejs-accessibility/no-autofocus -->
  <CommonTiptapTextEditor
    v-model="doc"
    :autofocus="autofocus"
    placeholder="Press enter to send"
    :schema-options="{ multiLine: false }"
    :disabled="disabled"
    @submit="onSubmit"
  />
</template>
<script setup lang="ts">
import { JSONContent } from '@tiptap/core'
import { Optional } from '@speckle/shared'

type CommentEditorValue = {
  doc: Optional<JSONContent>
}

const emit = defineEmits<{
  (e: 'update:modelValue', val: Optional<CommentEditorValue>): void
  (e: 'submit', val: { data: JSONContent }): void
}>()

const props = defineProps<{
  modelValue?: CommentEditorValue
  disabled?: boolean
  autofocus?: boolean
}>()

const value = computed({
  get: () => props.modelValue,
  set: (newVal) => emit('update:modelValue', newVal)
})

const doc = computed({
  get: () => value.value?.doc,
  set: (newVal) =>
    (value.value = {
      ...(value.value || {}),
      doc: newVal
    })
})

const onSubmit = (val: { data: JSONContent }) => emit('submit', val)
</script>

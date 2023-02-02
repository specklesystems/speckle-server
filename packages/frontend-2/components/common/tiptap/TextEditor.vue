<template>
  <div class="text-editor flex flex-col">
    <EditorContent class="simple-scrollbar" />
  </div>
</template>
<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { Editor, JSONContent } from '@tiptap/core'
import {
  EnterKeypressTrackerExtensionStorage,
  getEditorExtensions,
  TiptapEditorSchemaOptions
} from '~~/lib/common/helpers/tiptap'

const emit = defineEmits<{
  (e: 'input', val: JSONContent): void
  (e: 'submit', val: { data: JSONContent }): void
}>()

const props = defineProps<{
  modelValue?: JSONContent
  schemaOptions?: TiptapEditorSchemaOptions
  maxHeight?: number
  minWidth?: boolean
  autofocus?: boolean
  disabled?: boolean
  placeholder?: string
  readonly?: boolean
}>()

const isMultiLine = computed(() => !!props.schemaOptions?.multiLine)
const isEditable = computed(() => !props.disabled && !props.readonly)
const hasEnterTracking = computed(() => !props.readonly && !isMultiLine.value)

const baseWidth = '250px'
const editor = computed(() =>
  markRaw(
    new Editor({
      content: props.modelValue,
      autofocus: props.autofocus,
      editable: isEditable.value,
      extensions: getEditorExtensions(props.schemaOptions, {
        placeholder: props.placeholder
      }),
      onUpdate: () => {
        const data = getData()
        if (!data || Object.keys(data).length < 1) return
        emit('input', data)
      }
    })
  )
)
const enterKeypressTracker = computed(() =>
  markRaw(
    editor.value.storage.enterKeypressTracker as EnterKeypressTrackerExtensionStorage
  )
)

const getData = (): JSONContent => editor.value.getJSON()
const onEnter = () => {
  if (isMultiLine.value || props.readonly) return
  emit('submit', { data: getData() })
}

watch(
  () => hasEnterTracking.value,
  (hasEnterTracking) => {
    if (hasEnterTracking) {
      enterKeypressTracker.value.subscribe(editor.value, onEnter)
    } else {
      enterKeypressTracker.value.unsubscribe(editor.value, onEnter)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  editor.value.destroy()
  enterKeypressTracker.value.unsubscribe(editor.value, onEnter)
})
</script>

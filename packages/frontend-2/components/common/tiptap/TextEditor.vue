<template>
  <div class="text-editor flex flex-col">
    <EditorContent
      class="simple-scrollbar"
      :editor="editor"
      :style="maxHeight ? `max-height: ${maxHeight}; overflow-y: auto;` : ''"
      @click="onEditorContentClick"
    />
    <div v-if="$slots.actions && !readonly">
      <slot name="actions" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { EditorContent, Editor } from '@tiptap/vue-3'
import { JSONContent } from '@tiptap/core'
import {
  EnterKeypressTrackerExtensionStorage,
  getEditorExtensions,
  TiptapEditorSchemaOptions
} from '~~/lib/common/helpers/tiptap'
import { Nullable } from '@speckle/shared'
import { userProfileRoute } from '~~/lib/common/helpers/route'

const emit = defineEmits<{
  (e: 'input', val: JSONContent): void
  (e: 'submit', val: { data: JSONContent }): void
}>()

const props = defineProps<{
  modelValue?: JSONContent
  schemaOptions?: TiptapEditorSchemaOptions
  maxHeight?: number
  autofocus?: boolean
  disabled?: boolean
  placeholder?: string
  readonly?: boolean
}>()

const isMultiLine = computed(() => !!props.schemaOptions?.multiLine)
const isEditable = computed(() => !props.disabled && !props.readonly)
const hasEnterTracking = computed(() => !props.readonly && !isMultiLine.value)

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
const onEditorContentClick = (e: MouseEvent) => {
  const closestSelectorTarget = (e.target as HTMLElement).closest(
    '.editor-mention'
  ) as Nullable<HTMLElement>
  if (!closestSelectorTarget) return

  onMentionClick(closestSelectorTarget.dataset.id as string, e)
  e.stopPropagation()
}

const onMentionClick = (userId: string, e: MouseEvent) => {
  if (!props.readonly) return

  const path = userProfileRoute(userId)
  const isMetaKey = e.metaKey || e.ctrlKey
  if (isMetaKey) {
    window.open(path, '_blank')
  } else {
    window.location.href = path
  }
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

watch(
  () => props.modelValue,
  (newVal) => {
    const isSame = JSON.stringify(newVal) === JSON.stringify(getData())
    if (isSame) return

    editor.value.commands.setContent(newVal || '')
  }
)

watch(
  () => isEditable.value,
  (isEditable) => {
    editor.value.setEditable(isEditable)
  }
)

onBeforeUnmount(() => {
  editor.value.destroy()
  enterKeypressTracker.value.unsubscribe(editor.value, onEnter)
})
</script>

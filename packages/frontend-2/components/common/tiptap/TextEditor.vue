<template>
  <div
    :class="['text-editor flex flex-col', !!readonly ? 'text-editor--read-only' : '']"
  >
    <EditorContent
      ref="editorContentRef"
      class="simple-scrollbar"
      :editor="editor"
      :style="maxHeight ? `max-height: ${maxHeight}; overflow-y: auto;` : ''"
      @click="onEditorContentClick"
      @keydown="onKeyDownHandler"
    />
    <div v-if="$slots.actions && !readonly">
      <slot name="actions" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { EditorContent, Editor } from '@tiptap/vue-3'
import type { JSONContent } from '@tiptap/core'
import { getEditorExtensions } from '~~/lib/common/helpers/tiptap'
import type {
  EnterKeypressTrackerExtensionStorage,
  TiptapEditorSchemaOptions
} from '~~/lib/common/helpers/tiptap'
import type { Nullable } from '@speckle/shared'
// import { userProfileRoute } from '~~/lib/common/helpers/route'
import { onKeyDown } from '@vueuse/core'
import { noop } from 'lodash-es'

const emit = defineEmits<{
  (e: 'update:modelValue', val: JSONContent): void
  (e: 'submit', val: { data: JSONContent }): void
  (e: 'created'): void
  (e: 'keydown', val: KeyboardEvent): void
}>()

const props = defineProps<{
  modelValue?: JSONContent | null
  schemaOptions?: TiptapEditorSchemaOptions
  maxHeight?: string
  autofocus?: boolean
  disabled?: boolean
  placeholder?: string
  readonly?: boolean
  /**
   * Used to invite users to project when their emails are mentioned
   */
  projectId?: string
  /**
   * Disable invitation CTA, e.g. if user doesn't have the required accesses
   */
  disableInvitationCta?: boolean
}>()

const editorContentRef = ref(null as Nullable<HTMLElement>)

const isMultiLine = computed(() => !!props.schemaOptions?.multiLine)
const isEditable = computed(() => !props.disabled && !props.readonly)
const hasEnterTracking = computed(() => !props.readonly && !isMultiLine.value)

const editor = new Editor({
  content: props.modelValue,
  autofocus: props.autofocus,
  editable: isEditable.value,
  extensions: getEditorExtensions(props.schemaOptions, {
    placeholder: props.placeholder,
    projectId:
      props.projectId && !props.disableInvitationCta ? props.projectId : undefined
  }),
  onUpdate: () => {
    const data = getData()
    if (!data || Object.keys(data).length < 1) return
    emit('update:modelValue', data)
  },
  onCreate: () => {
    emit('created')
  }
})

const enterKeypressTracker = editor.storage
  .enterKeypressTracker as EnterKeypressTrackerExtensionStorage
const getData = (): JSONContent => editor.getJSON()
const onEnter = () => {
  if (isMultiLine.value || props.readonly) return
  emit('submit', { data: getData() })
}
const onKeyDownHandler = (e: KeyboardEvent) => emit('keydown', e)
const onEditorContentClick = (e: MouseEvent) => {
  const closestSelectorTarget = (e.target as HTMLElement).closest(
    '.editor-mention'
  ) as Nullable<HTMLElement>
  if (!closestSelectorTarget) return

  onMentionClick(closestSelectorTarget.dataset.id as string, e)
  e.stopPropagation()
}

// TODO: No profile page to link to in FE2 yet
// const onMentionClick = (userId: string, e: MouseEvent) => {
//   if (!props.readonly) return

//   const path = userProfileRoute(userId)
//   const isMetaKey = e.metaKey || e.ctrlKey
//   if (isMetaKey) {
//     window.open(path, '_blank')
//   } else {
//     window.location.href = path
//   }
// }
const onMentionClick = noop

onKeyDown(
  'Escape',
  (e) => {
    // TipTap handles Escape, we don't want this to bubble up and close the thread
    e.stopImmediatePropagation()
    e.stopPropagation()
  },
  { target: editorContentRef }
)

watch(
  () => hasEnterTracking.value,
  (hasEnterTracking) => {
    if (hasEnterTracking) {
      enterKeypressTracker.subscribe(editor, onEnter)
    } else {
      enterKeypressTracker.unsubscribe(editor, onEnter)
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (newVal) => {
    const isSame = JSON.stringify(newVal) === JSON.stringify(getData())
    if (isSame) return

    editor.commands.setContent(newVal || '')
  }
)

watch(
  () => isEditable.value,
  (isEditable) => {
    editor.setEditable(isEditable)
  }
)

onBeforeUnmount(() => {
  editor.destroy()
  enterKeypressTracker.unsubscribe(editor, onEnter)
})
</script>
<style lang="postcss">
/* stylelint-disable selector-class-pattern */
.ProseMirror-focused {
  outline: none;
}

.ProseMirror {
  & p:last-of-type {
    margin-bottom: 0;
  }

  & p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    pointer-events: none;
    height: 0;
    @apply text-foreground-disabled;
  }

  & .editor-mention {
    box-decoration-break: clone;
    @apply border-foreground border;
    @apply label label--light rounded inline-block px-1 py-[0.5px];
  }
}

.text-editor {
  &--read-only {
    word-break: break-word;
    background-color: unset !important;
    box-shadow: unset !important;

    .editor-mention {
      /* cursor: pointer; TODO: Reenable once mentions are clickable again */
    }
  }
}
</style>

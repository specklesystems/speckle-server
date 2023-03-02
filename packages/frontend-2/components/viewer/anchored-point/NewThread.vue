<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div
    v-if="modelValue.isVisible"
    class="absolute pointer-events-auto"
    :style="{
      ...modelValue.style,
      opacity: 1
    }"
  >
    <div class="relative">
      <FormButton
        :icon-left="PlusIcon"
        hide-text
        :style="{ opacity: modelValue.style.opacity }"
        @click="onThreadClick"
      />
      <div
        v-if="modelValue.isExpanded"
        ref="threadContainer"
        class="absolute"
        :style="style"
      >
        <div class="relative">
          <ViewerCommentsEditor
            ref="editor"
            v-model="commentValue"
            max-height="300px"
            autofocus
            @submit="() => onSubmit()"
          />
          <div class="absolute w-full flex justify-between pt-2 space-x-2">
            <div class="flex space-x-2">
              <FormButton
                :icon-left="HeartIcon"
                hide-text
                color="invert"
                class="text-red-600"
                @click="() => submitEmoji('❤️')"
              />
              <FormButton
                :icon-left="ExclamationTriangleIcon"
                hide-text
                color="invert"
                class="text-orange-500"
                @click="() => submitEmoji('⚠️')"
              />
              <FormButton
                :icon-left="FireIcon"
                hide-text
                color="invert"
                class="text-red-600"
                @click="() => submitEmoji('🔥')"
              />
            </div>
            <div class="space-x-2">
              <FormButton
                :icon-left="PaperClipIcon"
                hide-text
                color="invert"
                @click="editor?.openFilePicker"
              />

              <FormButton
                :icon-left="PaperAirplaneIcon"
                hide-text
                @click="() => onSubmit()"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  HeartIcon,
  PlusIcon,
  FireIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PaperClipIcon
} from '@heroicons/vue/24/solid'
import { Nullable } from '@speckle/shared'
import { RichTextEditor } from '@speckle/shared'
import {
  useExpandedThreadResponsiveLocation,
  ViewerNewThreadBubbleModel
} from '~~/lib/viewer/composables/commentBubbles'
import {
  CommentEditorValue,
  useSubmitComment
} from '~~/lib/viewer/composables/commentManagement'
import {
  isValidCommentContentInput,
  convertCommentEditorValueToInput
} from '~~/lib/viewer/helpers/comments'

const emit = defineEmits<{
  (e: 'update:modelValue', v: ViewerNewThreadBubbleModel): void
  (e: 'close'): void
}>()

const props = defineProps<{
  modelValue: ViewerNewThreadBubbleModel
}>()

const editor = ref(null as Nullable<{ openFilePicker: () => void }>)
const commentValue = ref(<CommentEditorValue>{ doc: undefined, attachments: undefined })
const threadContainer = ref(null as Nullable<HTMLElement>)

const { style } = useExpandedThreadResponsiveLocation({
  threadContainer,
  width: 320
})
const createThread = useSubmitComment()

const onThreadClick = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    isExpanded: !props.modelValue.isExpanded
  })
}

const submitEmoji = (emoji: string) =>
  onSubmit({ doc: RichTextEditor.convertBasicStringToDocument(emoji) })

const onSubmit = (comment?: CommentEditorValue) => {
  comment ||= comment || commentValue.value
  if (!comment?.doc) return

  const content = convertCommentEditorValueToInput(commentValue.value)
  if (!isValidCommentContentInput(content)) return

  // Intentionally not awaiting so that we emit close immediately
  createThread(content, props.modelValue.clickLocation)

  // Marking all uploads as in use to prevent cleanup
  comment.attachments?.forEach((a) => {
    a.inUse = true
  })

  emit('close')
}

watch(
  () => props.modelValue.isExpanded,
  () => {
    commentValue.value = {
      doc: undefined,
      attachments: undefined
    }
  }
)
</script>

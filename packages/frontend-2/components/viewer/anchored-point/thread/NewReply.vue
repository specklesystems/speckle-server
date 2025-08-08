<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div class="w-full relative flex flex-col p-2 pt-1">
    <FormFileUploadZone
      ref="uploadZone"
      v-slot="{ isDraggingFiles }"
      :size-limit="maxSizeInBytes"
      :accept="acceptValue"
      :disabled="loading"
      multiple
      @files-selected="onFilesSelected"
    >
      <div
        class="border border-outline-2 rounded-lg dark:bg-foundation-2"
        :class="[isDraggingFiles && 'border-dashed border-primary']"
      >
        <ViewerCommentsEditor
          ref="editor"
          v-model="commentValue"
          prompt="Add reply"
          autofocus
          disable-drop-zone
          @keydown="onKeyDownHandler"
          @submit="onSubmit"
        />
        <div class="flex justify-between items-center p-1">
          <FormButton
            :icon-left="PaperClipIcon"
            :disabled="loading"
            color="subtle"
            hide-text
            class="!bg-foundation dark:!bg-foundation-2"
            @click="trackAttachAndOpenFilePicker()"
          />
          <FormButton
            :icon-left="PaperAirplaneIcon"
            hide-text
            :disabled="loading"
            @click="onSubmit"
          />
        </div>
      </div>
    </FormFileUploadZone>
  </div>
</template>
<script setup lang="ts">
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/vue/24/solid'
import type { Nullable } from '@speckle/shared'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useIsTypingUpdateEmitter } from '~~/lib/viewer/composables/commentBubbles'
import type { CommentBubbleModel } from '~~/lib/viewer/composables/commentBubbles'
import { useSubmitReply } from '~~/lib/viewer/composables/commentManagement'
import type { CommentEditorValue } from '~~/lib/viewer/composables/commentManagement'
import {
  convertCommentEditorValueToInput,
  isValidCommentContentInput
} from '~~/lib/viewer/helpers/comments'
import { useServerFileUploadLimit } from '~~/lib/common/composables/serverInfo'
import { UniqueFileTypeSpecifier } from '~~/lib/core/helpers/file'
import { acceptedFileExtensions } from '@speckle/shared/blobs'
import type { UploadableFileItem } from '@speckle/ui-components'

const props = defineProps<{
  modelValue: CommentBubbleModel
}>()

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const createReply = useSubmitReply()
const { onKeyDownHandler, updateIsTyping } = useIsTypingUpdateEmitter()
const { projectId } = useInjectedViewerState()
const { maxSizeInBytes } = useServerFileUploadLimit()

const loading = ref(false)
const editor = ref(
  null as Nullable<{
    openFilePicker: () => void
    onFilesSelected: (payload: { files: UploadableFileItem[] }) => void
  }>
)
const uploadZone = ref(null as Nullable<{ triggerPicker: () => void }>)
const commentValue = ref<CommentEditorValue>({ doc: undefined, attachments: undefined })
const threadId = computed(() => props.modelValue.id)

const acceptValue = [
  UniqueFileTypeSpecifier.AnyImage,
  UniqueFileTypeSpecifier.AnyVideo,
  ...acceptedFileExtensions.map((fileExtension) => `.${fileExtension}`)
].join(',')

const onFilesSelected = (payload: { files: UploadableFileItem[] }) => {
  editor.value?.onFilesSelected(payload)
}

const mp = useMixpanel()
const trackAttachAndOpenFilePicker = () => {
  uploadZone.value?.triggerPicker()
  mp.track('Comment Action', { type: 'action', name: 'attach' })
}

const onSubmit = async () => {
  if (!commentValue.value || loading.value) return

  const content = convertCommentEditorValueToInput(commentValue.value)
  if (!isValidCommentContentInput(content)) return

  loading.value = true
  try {
    await createReply({
      content,
      threadId: threadId.value,
      projectId: projectId.value
    })
    updateIsTyping(false)

    // Mark all attachments as in use to prevent cleanup
    commentValue.value.attachments?.forEach((a) => {
      a.inUse = true
    })

    commentValue.value = {
      doc: undefined,
      attachments: undefined
    }
    emit('submit')
  } finally {
    loading.value = false
  }
}
</script>

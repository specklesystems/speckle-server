<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div class="flex flex-col w-full max-h-32 overflow-y-auto simple-scrollbar pr-1">
    <FormFileUploadZone
      ref="uploadZone"
      v-slot="{ isDraggingFiles }"
      :size-limit="maxSizeInBytes"
      :accept="acceptValue"
      :disabled="disabled"
      multiple
      @files-selected="onFilesSelected"
    >
      <CommonTiptapTextEditor
        v-model="doc"
        :class="[
          'dark:bg-foundation-2 bg-foundation-page rounded-lg p-2 border border-outline-2 text-body-2xs min-h-[56px] flex',
          isDraggingFiles && 'border-dashed'
        ]"
        :autofocus="autofocus"
        :placeholder="prompt || 'Press enter to send'"
        :schema-options="{ multiLine: false }"
        :disabled="disabled"
        :project-id="projectId"
        :disable-invitation-cta="!canInvite"
        @submit="onSubmit"
        @created="$emit('created')"
      />
    </FormFileUploadZone>
    <FormFileUploadProgress
      v-if="uploads.length"
      class="mt-2"
      :items="uploads"
      :disabled="disabled"
      @delete="onUploadDelete"
    />
  </div>
</template>
<script setup lang="ts">
import type { JSONContent } from '@tiptap/core'
import type { Nullable, Optional } from '@speckle/shared'
import type { CommentEditorValue } from '~~/lib/viewer/composables/commentManagement'
import { useServerFileUploadLimit } from '~~/lib/common/composables/serverInfo'
import { UniqueFileTypeSpecifier } from '~~/lib/core/helpers/file'
import { useAttachments } from '~~/lib/core/composables/fileUpload'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { isSuccessfullyUploaded } from '~~/lib/core/api/blobStorage'
import { canInviteToProject } from '~~/lib/projects/helpers/permissions'
import { acceptedFileExtensions } from '@speckle/shared/blobs'

const emit = defineEmits<{
  (e: 'update:modelValue', val: Optional<CommentEditorValue>): void
  (e: 'submit', val: { data: CommentEditorValue }): void
  (e: 'created'): void
}>()

const props = defineProps<{
  modelValue?: CommentEditorValue
  disabled?: boolean
  autofocus?: boolean
  prompt?: string
}>()

const {
  projectId,
  resources: {
    response: { project }
  }
} = useInjectedViewerState()
const { onFilesSelected, uploads, onUploadDelete } = useAttachments({ projectId })
const { maxSizeInBytes } = useServerFileUploadLimit()

const uploadZone = ref(null as Nullable<{ triggerPicker: () => void }>)
const acceptValue = ref(
  [
    UniqueFileTypeSpecifier.AnyImage,
    UniqueFileTypeSpecifier.AnyVideo,
    ...acceptedFileExtensions.map((fileExtension) => `.${fileExtension}`)
  ].join(',')
)

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

const canInvite = computed(() => canInviteToProject(project.value || {}))

const onSubmit = (val: { data: JSONContent }) =>
  emit('submit', { data: { doc: val.data } })

const openFilePicker = () => {
  uploadZone.value?.triggerPicker()
}

// sync upload updates to modelValue
watch(
  uploads,
  (newUploads) => {
    value.value = {
      ...value.value,
      attachments: newUploads.filter(isSuccessfullyUploaded)
    }
  },
  { deep: true }
)

// remove removed attachments from modelValue
watch(
  () => props.modelValue?.attachments,
  (newAttachments) => {
    if (!newAttachments && uploads.value.length) {
      uploads.value = []
    }
  }
)

defineExpose({
  openFilePicker
})
</script>

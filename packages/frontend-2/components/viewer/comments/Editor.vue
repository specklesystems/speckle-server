<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div class="flex flex-col w-80">
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
          'bg-foundation rounded-4xl p-4 border',
          isDraggingFiles ? 'border-success' : 'border-transparent'
        ]"
        :autofocus="autofocus"
        placeholder="Press enter to send"
        :schema-options="{ multiLine: false }"
        :disabled="disabled"
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
import { JSONContent } from '@tiptap/core'
import { Nullable, Optional } from '@speckle/shared'
import { CommentEditorValue } from '~~/lib/viewer/composables/commentManagement'
import { useServerFileUploadLimit } from '~~/lib/common/composables/serverInfo'
import { UniqueFileTypeSpecifier } from '~~/lib/core/helpers/file'
import { useAttachments } from '~~/lib/core/composables/fileUpload'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { isSuccessfullyUploaded } from '~~/lib/core/api/blobStorage'

const emit = defineEmits<{
  (e: 'update:modelValue', val: Optional<CommentEditorValue>): void
  (e: 'submit', val: { data: CommentEditorValue }): void
  (e: 'created'): void
}>()

const props = defineProps<{
  modelValue?: CommentEditorValue
  disabled?: boolean
  autofocus?: boolean
}>()

const { projectId } = useInjectedViewerState()
const { onFilesSelected, uploads, onUploadDelete } = useAttachments({ projectId })
const { maxSizeInBytes } = useServerFileUploadLimit()

const uploadZone = ref(null as Nullable<{ triggerPicker: () => void }>)
const acceptValue = ref(
  [
    UniqueFileTypeSpecifier.AnyImage,
    UniqueFileTypeSpecifier.AnyVideo,
    '.pdf',
    '.zip',
    '.7z',
    '.pptx',
    '.ifc',
    '.dwg',
    '.dxf',
    '.3dm',
    '.ghx',
    '.gh',
    '.rvt',
    '.pla',
    '.pln',
    '.obj',
    '.blend',
    '.3ds',
    '.max',
    '.mtl',
    '.stl',
    '.md',
    '.txt',
    '.csv',
    '.xlsx',
    '.xls',
    '.doc',
    '.docx',
    '.svg',
    '.eps',
    '.gwb',
    '.skp'
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

const onSubmit = (val: { data: JSONContent }) =>
  emit('submit', { data: { doc: val.data } })

const openFilePicker = () => {
  uploadZone.value?.triggerPicker()
}

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

defineExpose({
  openFilePicker
})
</script>

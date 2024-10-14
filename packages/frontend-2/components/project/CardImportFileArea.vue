<template>
  <FormFileUploadZone
    ref="uploadZone"
    v-slot="{ isDraggingFiles }"
    :disabled="isUploading"
    :size-limit="maxSizeInBytes"
    :accept="accept"
    class="flex items-center h-full"
    @files-selected="onFilesSelected"
  >
    <div
      class="w-full h-full border-dashed border rounded-md p-4 flex items-center justify-center text-sm"
      :class="[getDashedBorderClasses(isDraggingFiles)]"
    >
      <div
        v-if="fileUpload"
        class="max-w-sm p-2 flex flex-col justify-center space-y-1 text-foreground-2"
      >
        <span class="text-center">
          {{ fileUpload.file.name }}
        </span>
        <span
          v-if="errorMessage"
          class="text-danger inline-flex space-x-1 items-center text-center"
        >
          <ExclamationTriangleIcon class="h-4 w-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </span>
        <div
          v-if="fileUpload.progress > 0"
          :class="[' w-full mt-2', progressBarClasses]"
          :style="progressBarStyle"
        />
      </div>
      <span v-else class="text-body-xs text-foreground-2 text-center select-none">
        Use our
        <NuxtLink target="_blank" :to="downloadManagerUrl" class="font-medium">
          connectors
        </NuxtLink>
        to publish a {{ modelName ? '' : 'new model' }} version to
        {{ modelName ? 'this model' : 'this project' }}, or drag and drop a IFC/OBJ/STL
        file here.
      </span>
    </div>
  </FormFileUploadZone>
</template>
<script setup lang="ts">
import { useFileImport } from '~~/lib/core/composables/fileImport'
import { useFileUploadProgressCore } from '~~/lib/form/composables/fileUpload'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import { downloadManagerUrl } from '~/lib/common/helpers/route'
import type { Nullable } from '@speckle/shared'

const props = defineProps<{
  projectId: string
  modelName?: string
}>()

const {
  maxSizeInBytes,
  onFilesSelected,
  accept,
  upload: fileUpload,
  isUploading
} = useFileImport(toRefs(props))

const { errorMessage, progressBarClasses, progressBarStyle } =
  useFileUploadProgressCore({
    item: fileUpload
  })

const uploadZone = ref(
  null as Nullable<{
    triggerPicker: () => void
  }>
)

const getDashedBorderClasses = (isDraggingFiles: boolean) => {
  if (isDraggingFiles) return 'border-primary'
  if (errorMessage.value) return 'border-danger'

  return 'border-outline-2'
}

const triggerPicker = () => {
  uploadZone.value?.triggerPicker()
}

defineExpose({
  triggerPicker
})
</script>

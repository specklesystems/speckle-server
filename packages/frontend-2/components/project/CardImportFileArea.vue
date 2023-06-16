<template>
  <FormFileUploadZone
    ref="uploadZone"
    v-slot="{ isDraggingFiles }"
    :disabled="isUploading"
    :size-limit="maxSizeInBytes"
    :accept="accept"
    class="flex items-center"
    @files-selected="onFilesSelected"
  >
    <div
      class="w-full h-full border-dashed border-2 rounded-md p-4 flex items-center justify-center text-sm"
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
          <ExclamationTriangleIcon class="h-4 w-4" />
          <span>{{ errorMessage }}</span>
        </span>
        <div
          v-if="fileUpload.progress > 0"
          :class="[' w-full mt-2', progressBarClasses]"
          :style="progressBarStyle"
        />
      </div>
      <span
        v-else
        class="text-foreground-2 text-center leading-7"
        :class="isModelCardVariant ? ' opacity-50 group-hover:opacity-100' : ''"
      >
        Use our
        <FormButton link size="sm" to="/downloads">connectors</FormButton>
        to publish a {{ modelName ? '' : 'new model' }} version to
        {{ modelName || 'this project' }}, or drag and drop a IFC/OBJ/STL file here.
      </span>
    </div>
  </FormFileUploadZone>
</template>
<script setup lang="ts">
import { useFileImport } from '~~/lib/core/composables/fileImport'
import { useFileUploadProgressCore } from '~~/lib/form/composables/fileUpload'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import { Nullable } from '@speckle/shared'

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

const isModelCardVariant = computed(() => !!props.modelName)

const getDashedBorderClasses = (isDraggingFiles: boolean) => {
  if (isDraggingFiles) return 'border-primary'
  if (errorMessage.value) return 'border-danger'

  return isModelCardVariant.value ? 'border-blue-500/10' : 'border-outline-2'
}

const triggerPicker = () => {
  uploadZone.value?.triggerPicker()
}

defineExpose({
  triggerPicker
})
</script>

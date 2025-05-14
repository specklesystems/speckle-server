<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <FormFileUploadZone
    ref="uploadZone"
    v-slot="{ isDraggingFiles, openFilePicker }"
    :disabled="isUploading || disabled"
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
      <div v-else :class="containerClasses">
        <div :class="illustrationClasses" class="max-w-lg">
          <IllustrationEmptystateProject v-if="emptyStateVariant === 'modelsSection'" />
          <IllustrationEmptystateProjectTab v-else />
        </div>

        <div>
          <p v-if="showEmptyState" class="text-foreground-2 text-heading-sm p-0 m-0">
            {{
              emptyStateVariant === 'modelsSection'
                ? 'The project has no models, yet.'
                : 'No models, yet.'
            }}
          </p>
          <p :class="paragraphClasses" class="text-body-xs text-foreground-2 mt-2 p-0">
            Use
            <NuxtLink :to="connectorsRoute" class="font-medium">
              <span class="underline">connectors</span>
            </NuxtLink>
            to publish a {{ modelName ? '' : 'new model' }} version to
            {{ modelName ? 'this model' : 'this project' }}, or drag and drop a
            IFC/OBJ/STL file here.
          </p>
          <div
            v-if="showEmptyState"
            :class="buttonsClasses"
            class="w-full flex flex-row gap-2 flex-wrap"
          >
            <FormButton :to="connectorsRoute" size="sm" color="outline">
              Install connectors
            </FormButton>
            <FormButton size="sm" color="outline" @click="openFilePicker">
              Upload a file
            </FormButton>
          </div>
        </div>
      </div>
    </div>
  </FormFileUploadZone>
</template>
<script setup lang="ts">
import { useFileImport } from '~~/lib/core/composables/fileImport'
import { useFileUploadProgressCore } from '~~/lib/form/composables/fileUpload'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import { connectorsRoute } from '~/lib/common/helpers/route'
import type { Nullable } from '@speckle/shared'

type EmptyStateVariants = 'modelGrid' | 'modelList' | 'modelsSection'

const props = defineProps<{
  projectId: string
  modelName?: string
  disabled?: boolean
  emptyStateVariant?: EmptyStateVariants
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

const showEmptyState = computed(
  () =>
    props.emptyStateVariant !== 'modelGrid' && props.emptyStateVariant !== 'modelList'
)

const baseContainerClasses = 'w-full flex justify-center items-center'

const illustrationClasses = computed(() => {
  const variants = {
    modelGrid: 'hidden',
    modelList: 'hidden',
    modelsSection: 'hidden min-[1350px]:block',
    default: ''
  }
  return variants[props.emptyStateVariant || 'default']
})

const paragraphClasses = computed(() => {
  const variants = {
    modelGrid: '',
    modelList: '',
    modelsSection: 'max-w-sm',
    default: 'max-w-sm'
  }
  return variants[props.emptyStateVariant || 'default']
})

const buttonsClasses = computed(() => {
  const variants = {
    modelGrid: 'mt-3',
    modelList: 'mt-3',
    modelsSection: 'mt-3',
    default: 'justify-center mt-6'
  }
  return variants[props.emptyStateVariant || 'default']
})

const containerClasses = computed(() => {
  const variants = {
    modelGrid: 'p-4 gap-4',
    modelList: 'p-4 gap-4 text-center ',
    modelsSection: 'p-4 gap-4 text-balance ',
    default: 'p-20 gap-8 text-balance flex-col text-center'
  }

  return `${baseContainerClasses} ${variants[props.emptyStateVariant || 'default']}`
})

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

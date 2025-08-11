<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <FormFileUploadZone
    ref="uploadZone"
    v-slot="{ isDraggingFiles, openFilePicker }"
    :disabled="isUploading || isDisabled"
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
          <TriangleAlert
            :size="LucideSize.base"
            :stroke-width="1.5"
            :absolute-stroke-width="true"
            class="shrink-0"
          />
          <span>{{ errorMessage }}</span>
        </span>
        <div
          v-else
          :class="['w-full mt-2', progressBarClasses]"
          :style="progressBarStyle"
        />
      </div>
      <div v-else :class="containerClasses">
        <div :class="illustrationClasses">
          <IllustrationEmptystateProject v-if="emptyStateVariant === 'modelsSection'" />
          <IllustrationEmptystateProjectTab v-else />
        </div>

        <div>
          <p v-if="emptyStateHeading" :class="emptyStateHeadingClasses">
            {{ emptyStateHeading }}
          </p>
          <p v-if="!isDisabled" :class="paragraphClasses">
            Use
            <NuxtLink :to="connectorsRoute" class="font-medium">
              <span class="underline">connectors</span>
            </NuxtLink>
            to publish a {{ modelName ? '' : 'new model' }} version to
            {{ modelName ? 'this model' : 'this project' }}, or drag and drop a
            IFC/OBJ/STL{{ isNextGenFileImporterEnabled ? '/SKP' : '' }} file here.
          </p>
          <div v-if="showEmptyState && !isDisabled" :class="buttonsClasses">
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
    <ProjectPageModelsNewDialog
      v-model:open="showNewModelDialog"
      :project-id="project.id"
      :model-name="fileUpload?.file.name"
      @submit="onModelCreate"
    />
  </FormFileUploadZone>
</template>
<script setup lang="ts">
import {
  useFileImport,
  useGlobalFileImportManager
} from '~~/lib/core/composables/fileImport'
import { useFileUploadProgressCore } from '~~/lib/form/composables/fileUpload'
import { TriangleAlert } from 'lucide-vue-next'
import { connectorsRoute } from '~/lib/common/helpers/route'
import type { Nullable } from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql'
import type {
  ProjectCardImportFileArea_ModelFragment,
  ProjectCardImportFileArea_ProjectFragment,
  ProjectPageLatestItemsModelItemFragment
} from '~/lib/common/generated/gql/graphql'
import type { FileAreaUploadingPayload } from '~/lib/form/helpers/fileUpload'
import { useIsNextGenFileImporterEnabled } from '~/composables/globals'

type EmptyStateVariants = 'modelGrid' | 'modelList' | 'modelsSection'

graphql(`
  fragment ProjectCardImportFileArea_Project on Project {
    id
    permissions {
      canCreateModel {
        ...FullPermissionCheckResult
      }
    }
    ...UseFileImport_Project
  }
`)

graphql(`
  fragment ProjectCardImportFileArea_Model on Model {
    id
    name
    permissions {
      canCreateVersion {
        ...FullPermissionCheckResult
      }
    }
    ...UseFileImport_Model
  }
`)

const emit = defineEmits<{
  /**
   * Emits when files start/finish uploading
   */
  uploading: [payload: FileAreaUploadingPayload]
}>()

const props = defineProps<{
  project: ProjectCardImportFileArea_ProjectFragment
  model?: ProjectCardImportFileArea_ModelFragment
  modelName?: string
  emptyStateVariant?: EmptyStateVariants
}>()

const isNextGenFileImporterEnabled = useIsNextGenFileImporterEnabled()
const { addFailedJob } = useGlobalFileImportManager()
const {
  maxSizeInBytes,
  onFilesSelected,
  accept,
  upload: fileUpload,
  isUploading,
  uploadSelected,
  resetSelected,
  isUploadable: isFileUploadUploadable
} = useFileImport({
  ...toRefs(props),
  manuallyTriggerUpload: true,
  fileSelectedCallback: () => {
    if (props.model) {
      // Uploading inside an existing model - trigger upload immediately
      uploadSelected()
    } else {
      if (!fileUpload.value?.error) {
        // Only if upload is valid, trigger model creation dialog
        showNewModelDialog.value = true
      }
    }
  },
  errorCallback: ({ failedJob }) => {
    // Register global file upload error and reset upload
    addFailedJob(failedJob)
    resetSelected()
  }
})

const { errorMessage, progressBarClasses, progressBarStyle } =
  useFileUploadProgressCore({
    item: fileUpload
  })

const uploadZone = ref(
  null as Nullable<{
    triggerPicker: () => void
  }>
)
const showNewModelDialog = ref(false)

const modelName = computed(() => props.modelName || props.model?.name)
const accessCheck = computed(() => {
  return props.model
    ? props.model.permissions.canCreateVersion
    : props.project.permissions.canCreateModel
})
const isDisabled = computed(() => !accessCheck.value.authorized)

const showEmptyState = computed(
  () =>
    props.emptyStateVariant !== 'modelGrid' && props.emptyStateVariant !== 'modelList'
)
const emptyStateHeading = computed(() => {
  if (showEmptyState.value) {
    return props.emptyStateVariant === 'modelsSection'
      ? 'The project has no models, yet.'
      : 'No models, yet.'
  }

  if (isDisabled.value) {
    return modelName.value
      ? 'The model has no versions, yet.'
      : 'The project has no models, yet.'
  }

  return undefined
})

const emptyStateHeadingClasses = computed(() => {
  const classParts = ['text-foreground-2 text-heading-sm p-0 m-0 ']

  if (isDisabled.value) {
    classParts.push('text-balance text-center')
  }

  return classParts.join(' ')
})

const containerClasses = computed(() => {
  const classParts = ['w-full flex justify-center items-center']

  if (props.emptyStateVariant === 'modelGrid') {
    classParts.push('p-4 gap-4')
  } else if (props.emptyStateVariant === 'modelList') {
    classParts.push('gap-4 text-center')
  } else if (props.emptyStateVariant === 'modelsSection') {
    classParts.push('p-4 gap-4 text-balance')
  } else {
    classParts.push('p-20 gap-8 text-balance flex-col text-center')
  }

  return classParts.join(' ')
})

const illustrationClasses = computed(() => {
  const classParts = ['max-w-lg']

  if (props.emptyStateVariant === 'modelGrid') {
    classParts.push('hidden')
  } else if (props.emptyStateVariant === 'modelList') {
    classParts.push('hidden')
  } else if (props.emptyStateVariant === 'modelsSection') {
    classParts.push('hidden min-[1350px]:block')
  } else {
    classParts.push('')
  }

  return classParts.join(' ')
})

const paragraphClasses = computed(() => {
  const classParts = ['text-body-xs text-foreground-2 mt-2 p-0']

  if (props.emptyStateVariant === 'modelGrid') {
    classParts.push('')
  } else if (props.emptyStateVariant === 'modelList') {
    classParts.push('')
  } else if (props.emptyStateVariant === 'modelsSection') {
    classParts.push('max-w-sm')
  } else {
    classParts.push('max-w-sm')
  }

  return classParts.join(' ')
})

const buttonsClasses = computed(() => {
  const classParts = ['w-full flex flex-row gap-2 flex-wrap']

  if (props.emptyStateVariant === 'modelGrid') {
    classParts.push('mt-3')
  } else if (props.emptyStateVariant === 'modelList') {
    classParts.push('mt-3')
  } else if (props.emptyStateVariant === 'modelsSection') {
    classParts.push('mt-3')
  } else {
    classParts.push('justify-center mt-6')
  }

  return classParts.join(' ')
})

const getDashedBorderClasses = (isDraggingFiles: boolean) => {
  if (isDraggingFiles) return 'border-primary'
  if (errorMessage.value) return 'border-danger'

  return 'border-outline-2'
}

const onModelCreate = (params: { model: ProjectPageLatestItemsModelItemFragment }) => {
  if (!isFileUploadUploadable.value) return

  uploadSelected({
    model: params.model
  })
}

const triggerPicker = () => {
  uploadZone.value?.triggerPicker()
}

watch(showNewModelDialog, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    // Should we unselect file? Only if model was not created
    if (!isUploading.value) {
      resetSelected()
    }
  }
})

watch(isUploading, (newVal, oldVal) => {
  // fileUpload is always gonna be non-null when isUploading changes
  emit('uploading', {
    isUploading: newVal,
    upload: fileUpload.value!,
    error: errorMessage.value
  })

  if (!newVal && oldVal) {
    // Reset file upload state when upload finishes
    resetSelected()
  }
})

defineExpose({
  triggerPicker
})
</script>

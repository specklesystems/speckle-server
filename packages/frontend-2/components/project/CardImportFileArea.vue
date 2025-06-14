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
            IFC/OBJ/STL file here.
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
      :model-name="selectedFile?.file.name"
      hijack-submit
      @submit="onModelCreate"
    />
  </FormFileUploadZone>
</template>
<script setup lang="ts">
import { useFileImport } from '~~/lib/core/composables/fileImport'
import {
  useFileUploadProgressCore,
  type UploadableFileItem
} from '~~/lib/form/composables/fileUpload'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import { connectorsRoute } from '~/lib/common/helpers/route'
import type { Nullable } from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql'
import type {
  ProjectCardImportFileArea_ModelFragment,
  ProjectCardImportFileArea_ProjectFragment
} from '~/lib/common/generated/gql/graphql'

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

const props = defineProps<{
  project: ProjectCardImportFileArea_ProjectFragment
  model?: ProjectCardImportFileArea_ModelFragment
  modelName?: string
  emptyStateVariant?: EmptyStateVariants
}>()

const {
  maxSizeInBytes,
  onFilesSelected: onFilesSelectedInternal,
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

const selectedFile = shallowRef<Nullable<UploadableFileItem>>(null)

const showNewModelDialog = computed({
  get: () => !!selectedFile.value,
  set: (newVal) => {
    if (!newVal) {
      selectedFile.value = null
    }
  }
})

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
    classParts.push('p-4 gap-4 text-center')
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

const onFilesSelected = (params: { files: UploadableFileItem[] }) => {
  const firstFile = params.files[0]
  if (!firstFile) return

  if (props.model) {
    // Uploading version to specific model, trigger upload instantly
    onFilesSelectedInternal({ files: [firstFile] })
    return
  }

  // Otherwise store selected file and show model create dialog
  selectedFile.value = firstFile
}

const onModelCreate = (params: { name: string; description?: string }) => {
  if (!selectedFile.value) return

  onFilesSelectedInternal({
    files: [selectedFile.value],
    modelName: params.name,
    modelDescription: params.description
  })

  selectedFile.value = null
}

const triggerPicker = () => {
  uploadZone.value?.triggerPicker()
}

defineExpose({
  triggerPicker
})
</script>

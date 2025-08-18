<template>
  <div>
    <ProjectPageModelsHeader
      v-model:selected-apps="selectedApps"
      v-model:selected-members="selectedMembers"
      v-model:grid-or-list="gridOrList"
      v-model:search="search"
      :project="project"
      :project-id="projectId"
      :disabled="loading"
      class="z-[1] relative"
    />
    <FormFileUploadZone
      v-if="hasModels"
      ref="uploadZone"
      v-slot="{ isDraggingFiles }"
      :disabled="!canCreateModel"
      :size-limit="maxSizeInBytes"
      :accept="accept"
      class="relative"
      @files-selected="onFilesSelected"
    >
      <div
        class="relative mt-8 min-h-[360px]"
        :class="[isDraggingFiles && canCreateModel ? 'pointer-events-none' : '']"
      >
        <div class="">
          <ProjectPageModelsResults
            v-model:grid-or-list="gridOrList"
            v-model:search="search"
            v-model:loading="loading"
            :source-apps="selectedApps"
            :contributors="selectedMembers"
            :project="project"
            :project-id="projectId"
            class="z-[0] relative"
            @clear-search="clearSearch"
          />
        </div>

        <div
          v-if="isDraggingFiles && canCreateModel"
          class="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10"
        >
          <div class="text-center p-8">
            <div class="text-heading-lg text-primary mb-2">Drop file to upload</div>
            <div class="text-body-sm text-foreground-2">
              Drop your IFC/OBJ/STL{{ isNextGenFileImporterEnabled ? '/SKP' : '' }} file
              here to create a new model
            </div>
          </div>
        </div>
      </div>
    </FormFileUploadZone>

    <div v-else class="mt-8">
      <ProjectPageModelsResults
        v-model:grid-or-list="gridOrList"
        v-model:search="search"
        v-model:loading="loading"
        :source-apps="selectedApps"
        :contributors="selectedMembers"
        :project="project"
        :project-id="projectId"
        class="z-[0] relative"
        @clear-search="clearSearch"
      />
    </div>

    <ProjectPageModelsNewDialog
      v-model:open="showNewModelDialog"
      :project-id="projectId"
      :model-name="fileUpload?.file.name"
      @submit="onModelCreate"
    />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import type { SourceAppDefinition } from '@speckle/shared'
import type { FormUsersSelectItemFragment } from '~~/lib/common/generated/gql/graphql'
import { projectModelsPageQuery } from '~~/lib/projects/graphql/queries'
import { useProjectPageItemViewType } from '~~/lib/projects/composables/projectPages'
import {
  useFileImport,
  useGlobalFileImportManager
} from '~~/lib/core/composables/fileImport'
import { useIsNextGenFileImporterEnabled } from '~/composables/globals'
import type { ProjectPageLatestItemsModelItemFragment } from '~/lib/common/generated/gql/graphql'

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const selectedMembers = ref([] as FormUsersSelectItemFragment[])
const selectedApps = ref([] as SourceAppDefinition[])
const gridOrList = useProjectPageItemViewType('Models')
const search = ref('')
const loading = ref(false)

const { result } = useQuery(projectModelsPageQuery, () => ({
  projectId: projectId.value
}))

const project = computed(() => result.value?.project)

// File upload logic
const isNextGenFileImporterEnabled = useIsNextGenFileImporterEnabled()
const { addFailedJob } = useGlobalFileImportManager()
const showNewModelDialog = ref(false)

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
  project: computed(() => project.value || { id: '' }),
  manuallyTriggerUpload: true,
  fileSelectedCallback: () => {
    if (!fileUpload.value?.error) {
      // Only if upload is valid, trigger model creation dialog
      showNewModelDialog.value = true
    }
  },
  errorCallback: ({ failedJob }) => {
    // Register global file upload error and reset upload
    addFailedJob(failedJob)
    resetSelected()
  }
})

const canCreateModel = computed(
  () => project.value?.permissions?.canCreateModel?.authorized ?? false
)

const hasModels = computed(() => (project.value?.models?.totalCount ?? 0) > 0)

const onModelCreate = (params: { model: ProjectPageLatestItemsModelItemFragment }) => {
  if (!isFileUploadUploadable.value) return

  uploadSelected({
    model: params.model
  })
}

const clearSearch = () => {
  search.value = ''
  selectedMembers.value = []
  selectedApps.value = []
}

// Watch for upload completion to reset state
watch(isUploading, (newVal, oldVal) => {
  if (!newVal && oldVal) {
    // Reset file upload state when upload finishes
    resetSelected()
  }
})

watch(showNewModelDialog, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    // Unselect file if model was not created
    if (!isUploading.value) {
      resetSelected()
    }
  }
})
</script>

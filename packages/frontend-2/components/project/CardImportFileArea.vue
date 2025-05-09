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
      class="w-full h-full border-dashed border rounded-md p-4 flex items-center justify-center text-sm cursor-pointer"
      :class="[getDashedBorderClasses(isDraggingFiles)]"
      @click="openFilePicker"
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
      <div v-else class="w-full flex flex-row justify-center items-center gap-2 p-3">
        <div v-if="emptyStateVariant === 'modelList'">
          <div class="hidden min-[1400px]:block">
            <ProjectEmptyStateIllustration />
          </div>
          <div class="max-w-[460px] text-center min-[1400px]:text-left">
            <h2 class="text-heading text-foreground-2 p-0 m-0 inline-block">
              modelList
            </h2>
            <p class="text-body-xs text-foreground-2 mt-2 p-0 text-balance">
              Use
              <NuxtLink
                target="_blank"
                :to="connectorsRoute"
                class="font-medium"
                @click.stop
              >
                <span class="underline">connectors</span>
              </NuxtLink>
              to publish a {{ modelName ? '' : 'new model' }} version to
              {{ modelName ? 'this model' : 'this project' }}, or drag and drop a
              IFC/OBJ/STL file here.
            </p>
            <p
              class="w-full flex flex-row gap-2 mt-3 flex-wrap justify-center min-[1400px]:justify-normal"
            >
              <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
                Upload a model
              </FormButton>
              <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
                Install connectors
              </FormButton>
              <!-- <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
              Getting started video
            </FormButton> -->
            </p>
          </div>
        </div>
        <div v-if="emptyStateVariant === 'modelGrid'">
          <div class="hidden min-[1400px]:block">
            <ProjectEmptyStateIllustration />
          </div>
          <div class="max-w-[460px] text-center min-[1400px]:text-left">
            <h2 class="text-heading text-foreground-2 p-0 m-0 inline-block">
              modelGrid
            </h2>
            <p class="text-body-xs text-foreground-2 mt-2 p-0 text-balance">
              Use
              <NuxtLink
                target="_blank"
                :to="connectorsRoute"
                class="font-medium"
                @click.stop
              >
                <span class="underline">connectors</span>
              </NuxtLink>
              to publish a {{ modelName ? '' : 'new model' }} version to
              {{ modelName ? 'this model' : 'this project' }}, or drag and drop a
              IFC/OBJ/STL file here.
            </p>
            <p
              class="w-full flex flex-row gap-2 mt-3 flex-wrap justify-center min-[1400px]:justify-normal"
            >
              <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
                Upload a model
              </FormButton>
              <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
                Install connectors
              </FormButton>
              <!-- <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
              Getting started video
            </FormButton> -->
            </p>
          </div>
        </div>
        <div v-else-if="emptyStateVariant === 'modelsSection'">
          <div class="hidden min-[1400px]:block">
            <ProjectEmptyStateIllustration />
          </div>
          <div class="max-w-[460px] text-center min-[1400px]:text-left">
            <h2 class="text-heading text-foreground-2 p-0 m-0 inline-block">
              modelsSection
            </h2>
            <p class="text-body-xs text-foreground-2 mt-2 p-0 text-balance">
              Use
              <NuxtLink
                target="_blank"
                :to="connectorsRoute"
                class="font-medium"
                @click.stop
              >
                <span class="underline">connectors</span>
              </NuxtLink>
              to publish a {{ modelName ? '' : 'new model' }} version to
              {{ modelName ? 'this model' : 'this project' }}, or drag and drop a
              IFC/OBJ/STL file here.
            </p>
            <p
              class="w-full flex flex-row gap-2 mt-3 flex-wrap justify-center min-[1400px]:justify-normal"
            >
              <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
                Upload a model
              </FormButton>
              <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
                Install connectors
              </FormButton>
              <!-- <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
              Getting started video
            </FormButton> -->
            </p>
          </div>
        </div>
        <div v-else-if="emptyStateVariant === 'default'">
          <div class="hidden min-[1400px]:block">
            <ProjectEmptyStateIllustration />
          </div>
          <div class="max-w-[460px] text-center min-[1400px]:text-left">
            <h2 class="text-heading text-foreground-2 p-0 m-0 inline-block">
              Default.
            </h2>
            <p class="text-body-xs text-foreground-2 mt-2 p-0 text-balance">
              Use
              <NuxtLink
                target="_blank"
                :to="connectorsRoute"
                class="font-medium"
                @click.stop
              >
                <span class="underline">connectors</span>
              </NuxtLink>
              to publish a {{ modelName ? '' : 'new model' }} version to
              {{ modelName ? 'this model' : 'this project' }}, or drag and drop a
              IFC/OBJ/STL file here.
            </p>
            <p
              class="w-full flex flex-row gap-2 mt-3 flex-wrap justify-center min-[1400px]:justify-normal"
            >
              <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
                Upload a model
              </FormButton>
              <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
                Install connectors
              </FormButton>
              <!-- <FormButton size="sm" color="outline" :icon-right="ChevronRightIcon">
              Getting started video
            </FormButton> -->
            </p>
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

const props = withDefaults(
  defineProps<{
    projectId: string
    modelName?: string
    disabled?: boolean
    emptyStateVariant?: 'modelGrid' | 'modelList' | 'modelsSection' | 'default'
  }>(),
  {
    emptyStateVariant: 'default'
  }
)

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

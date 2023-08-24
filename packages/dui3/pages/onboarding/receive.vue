<template>
  <div
    class="flex flex-col items-center justify-center h-[calc(100vh-16rem)] px-4 space-y-2"
  >
    <div class="h3">{{ `Let's receive our first model to ${hostAppName}.` }}</div>
    <form
      class="flex flex-col justify-center space-y-4"
      @submit="onProjectModelSelected"
    >
      <h2 class="h5 font-bold block">Choose Speckle project</h2>
      <p>Choose a Speckle project and model which you want receive.</p>
      <div class="flex flex-col max-w-sm w-full mx-auto space-y-4">
        <FormSelectBase
          v-model="selectedProject"
          :multiple="false"
          :search="true"
          search-placeholder="Project"
          label="Project"
          :show-label="true"
          name="projects"
          :rules="[ValidationHelpers.isRequired]"
        />
        <FormSelectBase
          v-if="selectedProject"
          v-model="selectedModel"
          :multiple="false"
          :search="true"
          search-placeholder="Model"
          label="Model"
          :show-label="true"
          name="models"
          :rules="[ValidationHelpers.isRequired]"
        />
      </div>
      <div class="flex justify-end">
        <FormButton submit :disabled="hasProjectFormErrors" size="lg">Next</FormButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
type ProjectsSelectItemType = { id: string; name: string }
type ModelsSelectItemType = { id: string; name: string }

import { useForm } from 'vee-validate'
import { useHostAppStore } from '~~/store/hostApp'
import { ValidationHelpers } from '@speckle/ui-components'

const hostAppStore = useHostAppStore()
const hostAppName = computed(() => hostAppStore.hostAppName)

const emit = defineEmits<{
  (
    e: 'next',
    payload: {
      model: ProjectsSelectItemType
      project: ModelsSelectItemType
    }
  ): void
}>()

const { handleSubmit, errors } = useForm<{
  model: ProjectsSelectItemType
  project: ModelsSelectItemType
}>()

const selectedProject = ref<ProjectsSelectItemType>()
const selectedModel = ref<ModelsSelectItemType>()

const hasProjectFormErrors = computed(() => {
  return Object.keys(errors.value).length > 0
})

const onProjectModelSelected = handleSubmit((values) => {
  emit('next', values)
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center h-[calc(100vh-16rem)] px-4 space-y-2"
  >
    <div class="h3">{{ `Let's receive our first model to ${hostAppName}.` }}</div>
    <form
      class="flex flex-col justify-center space-y-4"
      @submit="onProjectModelSelected"
    >
      <p>Choose a Speckle project and model which you want receive.</p>
      <div class="flex flex-col max-w-sm w-full mx-auto space-y-4">
        <FormSelectProjects
          v-model="selectedProject"
          name="project"
          label="Speckle project"
          :rules="[ValidationHelpers.isRequired]"
          validate-on-value-update
        />
        <FormSelectModels
          v-if="selectedProject"
          v-model="selectedModel"
          :project-id="selectedProject.id"
          name="model"
          label="Speckle model"
          :rules="[ValidationHelpers.isRequired]"
          validate-on-value-update
        />
      </div>
      <div class="flex justify-end">
        <FormButton
          v-if="selectedModel"
          submit
          :disabled="hasProjectFormErrors"
          size="lg"
        >
          Receive
        </FormButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { useHostAppStore } from '~~/store/hostApp'
import { ValidationHelpers } from '@speckle/ui-components'
import { ProjectsSelectItemType, ModelsSelectItemType } from 'lib/form/select/types'

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

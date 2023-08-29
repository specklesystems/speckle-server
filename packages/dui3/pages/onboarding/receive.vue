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
        <FormSelectBase
          v-model="selectProjectValue"
          :items="projects"
          :multiple="false"
          :search="true"
          search-placeholder="Project"
          :get-search-results="invokeProjectSearch"
          label="Project"
          :show-label="true"
          name="projects"
          :rules="[ValidationHelpers.isRequired]"
        >
          <template #something-selected="{ value }">
            <div class="text-normal">
              {{ value.name }}
            </div>
          </template>
          <template #option="{ item }">
            <div class="flex items-center">
              <span class="truncate">{{ item.name }}</span>
            </div>
          </template>
        </FormSelectBase>
        <FormSelectBase
          v-if="selectProjectValue !== undefined"
          v-model="selectModelValue"
          :items="models"
          :multiple="false"
          :search="true"
          search-placeholder="Model"
          :get-search-results="invokeModelSearch"
          label="Model"
          :show-label="true"
          name="models"
          :rules="[ValidationHelpers.isRequired]"
        />
      </div>
      <div class="flex justify-end">
        <FormButton
          v-if="selectModelValue"
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
type ProjectsSelectItemType = { id: string; name: string }
type ModelsSelectItemType = { id: string; name: string }

import { useForm } from 'vee-validate'
import { useHostAppStore } from '~~/store/hostApp'
import { ValidationHelpers } from '@speckle/ui-components'
import { useGetProjects } from '~/lib/graphql/composables'
import { Nullable } from '@speckle/shared'

const hostAppStore = useHostAppStore()
const hostAppName = computed(() => hostAppStore.hostAppName)

type ItemType = ProjectsSelectItemType | ModelsSelectItemType
type ValueType = ItemType | ItemType[] | undefined

const props = defineProps({
  projectValue: {
    type: [Object, Array] as PropType<ValueType>,
    default: undefined
  },
  modelValue: {
    type: [Object, Array] as PropType<ValueType>,
    default: undefined
  }
})

const selectProjectValue = computed(() => props.projectValue)
const selectModelValue = computed(() => props.modelValue)

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
  (
    e: 'next',
    payload: {
      model: ProjectsSelectItemType
      project: ModelsSelectItemType
    }
  ): void
}>()

const getProjects = useGetProjects()

type ProjectsType = {
  id: string | undefined
  name: string | undefined
}

type ModelsType = {
  id: string | undefined
  name: string | undefined
}

const projects = ref<ProjectsType[]>()
const models = ref<ModelsType[]>()

const invokeProjectSearch = async (search: string) => {
  const res = (await getProjects(search)) as ProjectsType[]
  console.log(res)
  projects.value = res
  return projects.value || []
}

const invokeModelSearch = async (search: string) => {
  const res = (await getProjects(search)) as ProjectsType[]
  console.log(res)
  projects.value = res
  return projects.value || []
}

const { handleSubmit, errors } = useForm<{
  model: ProjectsSelectItemType
  project: ModelsSelectItemType
}>()

const hasProjectFormErrors = computed(() => {
  return Object.keys(errors.value).length > 0
})

const onProjectModelSelected = handleSubmit((values) => {
  emit('next', values)
})
</script>

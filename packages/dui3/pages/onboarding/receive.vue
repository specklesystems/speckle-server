<template>
  <div
    class="flex flex-col items-center justify-center h-[calc(100vh-16rem)] px-4 space-y-2"
  >
    <Portal to="navigation">
      <FormButton to="/" size="sm" :icon-left="ArrowLeftIcon" class="ml-2">
        Back home
      </FormButton>
    </Portal>
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
          label="Projects"
          show-label
          :rules="[ValidationHelpers.isRequired]"
          validate-on-value-update
        />
        <FormSelectModels
          v-if="selectedProject"
          v-model="selectedModel"
          :project-id="(selectedProject.id as string)"
          name="model"
          label="Model"
          show-label
          :rules="[ValidationHelpers.isRequired]"
          validate-on-value-update
        />
        <FormSelectVersions
          v-if="selectedProject && selectedModel"
          v-model="selectedVersion"
          :project-id="(selectedProject.id as string)"
          :model-id="(selectedModel.id as string)"
          name="version"
          label="Version"
          show-label
          :rules="[ValidationHelpers.isRequired]"
          validate-on-value-update
        />
      </div>
      <div class="flex justify-end">
        <FormButton
          v-if="selectedVersion"
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
import { nanoid } from 'nanoid'
import { useForm } from 'vee-validate'
import { useHostAppStore } from '~~/store/hostApp'
import { useAccountStore } from '~~/store/accounts'
import { ValidationHelpers } from '@speckle/ui-components'
import {
  ProjectsSelectItemType,
  ModelsSelectItemType,
  VersionsSelectItemType
} from 'lib/form/select/types'
import { IReceiverModelCard } from '~~/lib/models/card/receiver'
import { ArrowLeftIcon } from '@heroicons/vue/20/solid'

const { defaultAccount } = storeToRefs(useAccountStore())
const hostAppStore = useHostAppStore()
const router = useRouter()
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
  version: VersionsSelectItemType
}>()

const selectedProject = ref<ProjectsSelectItemType>()
const selectedModel = ref<ModelsSelectItemType>()
const selectedVersion = ref<VersionsSelectItemType>()

const hasProjectFormErrors = computed(() => {
  return Object.keys(errors.value).length > 0
})

const receive = async () => {
  if (!defaultAccount.value) return

  const modelCard: IReceiverModelCard = {
    typeDiscriminator: 'ReceiverModelCard',
    id: nanoid(),
    modelId: selectedModel.value?.id as string,
    projectId: selectedProject.value?.id as string,
    accountId: defaultAccount.value.accountInfo.id,
    referencedObject: selectedVersion.value?.referencedObject as string,
    modelName: selectedModel.value?.name as string,
    projectName: selectedProject.value?.name as string,
    sourceApp: selectedVersion.value?.sourceApplication as string,
    notifications: []
  }

  await hostAppStore.addModel(modelCard)
  router.push('/')
  setTimeout(async () => {
    await hostAppStore.receiveModel(modelCard.id, selectedVersion.value?.id as string)
  }, 200)
}

const onProjectModelSelected = handleSubmit(async (values) => {
  await receive()
  emit('next', values)
})
</script>

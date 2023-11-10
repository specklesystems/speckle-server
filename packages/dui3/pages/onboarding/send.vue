<template>
  <div
    class="flex flex-col items-center justify-center h-[calc(100vh-16rem)] px-4 space-y-2"
  >
    <Portal to="navigation">
      <FormButton
        to="/onboardingIndex"
        size="sm"
        :icon-left="ArrowLeftIcon"
        class="ml-2"
      >
        Onboarding
      </FormButton>
    </Portal>
    <!-- STEP 0 -->
    <div class="space-y-4 w-full">
      <div class="h3">Let's publish our first model to Speckle.</div>
      <div
        v-if="!hasSelectedSomethingNow && selectionInfo.selectedObjectIds?.length === 0"
        class="h4 text-primary"
      >
        First: select a part of your model.
      </div>
      <div
        v-if="hasSelectedSomethingNow || selectionInfo.selectedObjectIds?.length !== 0"
        class="h4 text-primary flex items-center space-x-2"
      >
        <span>Great object selection! {{ selectionInfo.summary }}</span>
      </div>
      <div v-if="!hasSelectedSomethingNow" class="text-foreground-2 text-xs">
        Or continue with publishing
        <FormButton text size="xs" @click="saveSelection">the whole model.</FormButton>
        This might take a bit longer.
      </div>
      <form
        class="flex flex-col justify-center space-y-4"
        @submit="onProjectModelSelected"
      >
        <FormSelectProjects
          v-if="hasSelectedSomethingNow"
          v-model="selectedProject"
          create
          name="project"
          label="Projects"
          show-label
          :rules="[ValidationHelpers.isRequired]"
          validate-on-value-update
        />
        <FormSelectModels
          v-if="selectedProject"
          v-model="selectedModel"
          create
          :project-id="(selectedProject.id as string)"
          name="model"
          label="Model"
          show-label
          :rules="[ValidationHelpers.isRequired]"
          validate-on-value-update
        />
        <div class="flex justify-end">
          <FormButton
            v-if="selectedModel"
            submit
            :disabled="hasProjectFormErrors"
            size="lg"
          >
            Let's publish!
          </FormButton>
        </div>
      </form>
    </div>
    <div class="text-xs text-foreground-2 w-full">
      Debug Current state:
      <br />
      - selection info: {{ selectionFilterCopy?.summary }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { SelectionInfo } from '~~/lib/bindings/definitions/ISelectionBinding'
import { useSelectionStore } from '~~/store/selection'
import { useAccountStore } from '~~/store/accounts'
import { useHostAppStore } from '~~/store/hostApp'
import { useConfigStore } from '~/store/config'
import { nanoid } from 'nanoid'
import { ValidationHelpers } from '@speckle/ui-components'
import { ModelsSelectItemType, ProjectsSelectItemType } from 'lib/form/select/types'
import { ISendFilter, ISenderModelCard } from '~~/lib/models/card/send'
import { ArrowLeftIcon } from '@heroicons/vue/20/solid'

const configStore = useConfigStore()

const store = useHostAppStore()
const router = useRouter()
const { defaultAccount } = storeToRefs(useAccountStore())

const selectionStore = useSelectionStore()
const { selectionInfo } = storeToRefs(selectionStore)

const hasSelectedSomethingNow = ref(false)

const selectionFilterCopy = ref<SelectionInfo>()

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

const onProjectModelSelected = handleSubmit(async (values) => {
  await publish()
  emit('next', values)
})

watch(selectionInfo, (newVal) => {
  hasSelectedSomethingNow.value = newVal?.selectedObjectIds?.length !== 0
  saveSelection()
})

const saveSelection = () => {
  selectionFilterCopy.value = { ...selectionInfo.value }
}

const getOrCreateModelCard = async () => {
  const modelCard = store.tryGetModel(selectedModel.value?.id)
  if (modelCard) {
    return modelCard
  } else {
    const sendFilter = {
      ...store.selectionFilter,
      ...selectionFilterCopy.value
    }
    if (!defaultAccount.value) return // to make ts happy, a bit of hack - should throw if this is the case, but this will be handled at a higher level (ie, whole page!)

    const modelCard: ISenderModelCard = {
      typeDiscriminator: 'SenderModelCard',
      id: nanoid(),
      modelId: selectedModel.value?.id as string,
      projectId: selectedProject.value?.id as string,
      accountId: defaultAccount.value.accountInfo.id,
      sendFilter: sendFilter as ISendFilter,
      notifications: []
    }

    await store.addModel(modelCard)
    return modelCard
  }
}

const publish = async () => {
  const modelCard = await getOrCreateModelCard()
  if (!modelCard) return // throw here error
  configStore.completeConnectorOnboarding('send')
  router.push('/')
  // Sketchup freezes immediately after routing, by setting timeout we can get correct states
  setTimeout(async () => {
    await store.sendModel(modelCard.id)
  }, 200)
}
</script>

<template>
  <CommonDialog
    :open="showSendDialog"
    fullscreen="none"
    :title="title"
    :show-back-button="step !== 1"
    @back="step--"
    @fully-closed="step = 1"
  >
    <div v-if="step === 1">
      <WizardProjectSelector
        disable-no-write-access-projects
        @next="selectProject"
        @search-text-update="updateSearchText"
      />
    </div>
    <!-- Model selector wizard -->
    <div v-if="step === 2 && selectedProject && selectedAccountId">
      <WizardModelSelector
        :project="selectedProject"
        :account-id="selectedAccountId"
        is-sender
        @next="selectModel"
      />
    </div>
    <!-- Version selector wizard -->
    <div v-if="step === 3">
      <SendFiltersAndSettings
        v-model="filter"
        @update:filter="(f) => (filter = f)"
        @update:settings="(s) => (settings = s)"
      />
      <div class="mt-2">
        <FormButton full-width @click="addModel">Publish</FormButton>
      </div>
    </div>
    <div v-if="urlParseError" class="p-2 text-xs text-danger">
      {{ urlParseError }}
    </div>
  </CommonDialog>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type {
  ModelListModelItemFragment,
  ProjectListProjectItemFragment
} from '~/lib/common/generated/gql/graphql'
import type { ISendFilter } from '~/lib/models/card/send'
import { SenderModelCard } from '~/lib/models/card/send'
import { useHostAppStore } from '~/store/hostApp'
import { useAccountStore } from '~/store/accounts'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import type { CardSetting } from '~/lib/models/card/setting'
import { useAddByUrl } from '~/lib/core/composables/addByUrl'

const { trackEvent } = useMixpanel()

const showSendDialog = ref(false)

const emit = defineEmits(['close'])

const step = ref(1)
const accountStore = useAccountStore()
const { activeAccount } = storeToRefs(accountStore)

const selectedAccountId = ref<string>(activeAccount.value?.accountInfo.id as string)
const selectedProject = ref<ProjectListProjectItemFragment>()
const selectedModel = ref<ModelListModelItemFragment>()
const filter = ref<ISendFilter | undefined>(undefined)
const settings = ref<CardSetting[] | undefined>(undefined)

const { tryParseUrl, urlParsedData, urlParseError } = useAddByUrl()
const updateSearchText = (text: string | undefined) => {
  urlParseError.value = undefined
  if (!text) return
  tryParseUrl(text, 'sender')
}

watch(urlParsedData, (newVal) => {
  if (!newVal) return
  selectProject(newVal.account?.accountInfo.id, newVal.project)
  selectModel(newVal.model)
})

const selectProject = (accountId: string, project: ProjectListProjectItemFragment) => {
  step.value++
  selectedAccountId.value = accountId
  selectedProject.value = project
  void trackEvent('DUI3 Action', { name: 'Publish Wizard', step: 'project selected' })
}

const title = computed(() => {
  if (step.value === 1) return 'Select project'
  if (step.value === 2) return 'Select model'
  if (step.value === 3) return 'Select objects'
  return ''
})

const selectModel = (model: ModelListModelItemFragment) => {
  step.value++
  selectedModel.value = model
  void trackEvent('DUI3 Action', { name: 'Publish Wizard', step: 'model selected' })
}

// Clears data if going backwards in the wizard
watch(step, (newVal, oldVal) => {
  if (newVal > oldVal) {
    return // exit fast on forward
  }
  if (newVal === 1) {
    selectedProject.value = undefined
    selectedModel.value = undefined
  }
  if (newVal === 2) selectedModel.value = undefined
})

const hostAppStore = useHostAppStore()

// accountId, serverUrl, projectId, modelId, sendFilter, settings
const addModel = async () => {
  void trackEvent('DUI3 Action', {
    name: 'Publish Wizard',
    step: 'objects selected',
    filter: filter.value?.typeDiscriminator
  })

  const existingModel = hostAppStore.models.find(
    (m) =>
      m.modelId === selectedModel.value?.id &&
      m.typeDiscriminator.includes('SenderModelCard')
  ) as SenderModelCard
  if (existingModel) {
    emit('close')
    // Patch the existing model card with new send filter and non-expired state!
    await hostAppStore.patchModel(existingModel.modelCardId, {
      sendFilter: filter.value as ISendFilter,
      expired: false
    })
    void hostAppStore.sendModel(existingModel.modelCardId, 'Wizard')
    return
  }

  const model = new SenderModelCard()
  model.accountId = selectedAccountId.value
  model.serverUrl = activeAccount.value?.accountInfo.serverInfo.url as string
  model.projectId = selectedProject.value?.id as string
  model.modelId = selectedModel.value?.id as string
  model.workspaceId = selectedProject.value?.workspaceId as string
  model.sendFilter = filter.value as ISendFilter
  model.sendFilter.idMap = {} // do not let it null from the beginning otherwise we will end up with null state on Revit...
  model.settings = settings.value
  model.expired = false

  emit('close')
  await hostAppStore.addModel(model)
  void hostAppStore.sendModel(model.modelCardId, 'Wizard')
}
</script>

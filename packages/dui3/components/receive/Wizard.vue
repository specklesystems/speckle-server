<template>
  <CommonDialog
    v-model:open="showReceiveDialog"
    fullscreen="none"
    :title="title"
    :show-back-button="step !== 1"
    @back="step--"
    @fully-closed="step = 1"
  >
    <div>
      <div v-if="step === 1">
        <WizardProjectSelector
          :show-new-project="false"
          @next="selectProject"
          @search-text-update="updateSearchText"
        />
      </div>
      <div v-if="step === 2 && selectedProject && selectedAccountId">
        <div>
          <WizardModelSelector
            :project="selectedProject"
            :account-id="selectedAccountId"
            :show-new-model="false"
            @next="selectModel"
          />
        </div>
      </div>
      <div v-if="step === 3">
        <WizardVersionSelector
          v-if="selectedProject && selectedModel"
          :account-id="selectedAccountId"
          :project-id="selectedProject.id"
          :model-id="selectedModel.id"
          :selected-version-id="urlParsedVersionId"
          :from-wizard="true"
          @next="selectVersionAndAddModel"
        />
      </div>
    </div>
    <div v-if="urlParseError" class="p-2 text-xs text-danger">{{ urlParseError }}</div>
  </CommonDialog>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type {
  ModelListModelItemFragment,
  ProjectListProjectItemFragment,
  VersionListItemFragment
} from '~/lib/common/generated/gql/graphql'
import { useHostAppStore } from '~/store/hostApp'
import { useAccountStore } from '~/store/accounts'
import { ReceiverModelCard } from '~/lib/models/card/receiver'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useAddByUrl } from '~/lib/core/composables/addByUrl'
import { getSlugFromHostAppNameAndVersion } from '~/lib/common/helpers/hostAppSlug'

const { trackEvent } = useMixpanel()

const showReceiveDialog = defineModel<boolean>({ default: false })

const emit = defineEmits(['close'])

const step = ref(1)

// Clears data if going backwards in the wizard
watch(step, (newVal, oldVal) => {
  if (newVal > oldVal) return // exit fast on forward
  if (newVal === 1) {
    selectedProject.value = undefined
    selectedModel.value = undefined
  }
  if (newVal === 2) selectedModel.value = undefined
})

const accountStore = useAccountStore()
const { activeAccount } = storeToRefs(accountStore)

const selectedAccountId = ref<string>(activeAccount.value?.accountInfo.id as string)
const selectedProject = ref<ProjectListProjectItemFragment>()
const selectedModel = ref<ModelListModelItemFragment>()

const { tryParseUrl, urlParsedData, urlParseError } = useAddByUrl()
const updateSearchText = (text: string | undefined) => {
  urlParseError.value = undefined
  if (!text) return
  tryParseUrl(text, 'receiver')
}

const urlParsedVersionId = ref<string>()
watch(urlParsedData, (newVal) => {
  if (!newVal) return
  selectProject(newVal.account?.accountInfo.id, newVal.project)
  selectModel(newVal.model)
  if (newVal.version) urlParsedVersionId.value = newVal.version.id
})

const selectProject = (accountId: string, project: ProjectListProjectItemFragment) => {
  step.value++
  selectedAccountId.value = accountId
  selectedProject.value = project

  void trackEvent('DUI3 Action', { name: 'Load Wizard', step: 'project selected' })
}

const selectModel = (model: ModelListModelItemFragment) => {
  step.value++
  selectedModel.value = model
  void trackEvent('DUI3 Action', { name: 'Load Wizard', step: 'model selected' })
}

const title = computed(() => {
  if (step.value === 1) return 'Select project'
  if (step.value === 2) return 'Select model'
  if (step.value === 3) return 'Select version'
  return ''
})

// accountId, serverUrl,  ModelListModelItemFragment, VersionListItemFragment
const selectVersionAndAddModel = async (
  version: VersionListItemFragment,
  latestVersion: VersionListItemFragment
) => {
  void trackEvent('DUI3 Action', {
    name: 'Load Wizard',
    step: 'version selected',
    hasSelectedLatestVersion: version.id === latestVersion.id
  })

  const existingModel = hostAppStore.models.find(
    (m) =>
      m.modelId === selectedModel.value?.id &&
      m.typeDiscriminator === 'ReceiverModelCard'
  ) as ReceiverModelCard

  if (existingModel) {
    emit('close')
    // Patch the existing model card with new versions!
    await hostAppStore.patchModel(existingModel.modelCardId, {
      selectedVersionId: version.id,
      selectedVersionSourceApp: version.sourceApplication,
      selectedVersionUserId: version.authorUser?.id,
      latestVersionId: latestVersion.id,
      latestVersionSourceApp: latestVersion.sourceApplication,
      latestVersionUserId: latestVersion.authorUser?.id
    })
    await hostAppStore.receiveModel(existingModel.modelCardId, 'Wizard')
    return
  }

  // We were tracking the source host app wrong before `getHostAppFromString`
  // i.e. we were having `Revit 2023` instead of `revit`
  const selectedVersionSourceApp = getSlugFromHostAppNameAndVersion(
    version.sourceApplication as string
  )
  const latestVersionSourceApp = getSlugFromHostAppNameAndVersion(
    latestVersion.sourceApplication as string
  )

  const modelCard = new ReceiverModelCard()
  modelCard.accountId = selectedAccountId.value
  modelCard.serverUrl = activeAccount.value.accountInfo.serverInfo.url

  modelCard.projectId = selectedProject.value?.id as string
  modelCard.modelId = selectedModel.value?.id as string
  modelCard.workspaceId = selectedProject.value?.workspaceId as string

  modelCard.projectName = selectedProject.value?.name as string
  modelCard.modelName = selectedModel.value?.name as string

  modelCard.selectedVersionId = version.id
  modelCard.selectedVersionSourceApp = selectedVersionSourceApp
  modelCard.selectedVersionUserId = version.authorUser?.id as string

  modelCard.latestVersionId = latestVersion.id
  modelCard.latestVersionSourceApp = latestVersionSourceApp
  modelCard.latestVersionUserId = latestVersion.authorUser?.id as string

  modelCard.hasDismissedUpdateWarning = true
  modelCard.hasSelectedOldVersion = version.id !== latestVersion.id

  emit('close')
  await hostAppStore.addModel(modelCard)
  await hostAppStore.receiveModel(modelCard.modelCardId, 'Wizard')
}

const hostAppStore = useHostAppStore()
</script>

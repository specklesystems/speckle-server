<template>
  <LayoutDialog
    v-model:open="showReceiveDialog"
    fullscreen="none"
    @fully-closed="step = 1"
  >
    <template #header>
      <div class="flex items-center space-x-2 mb-0">
        <div
          class="text-xs mt-[3px] font-normal bg-primary-muted text-foreground-2 rounded-full justify-center items-center flex px-2"
        >
          {{ step }}/3
        </div>
        <div v-if="step === 1" class="h5 font-bold">Select project</div>
        <div v-if="step === 2" class="h5 font-bold">Select model</div>
        <div v-if="step === 3" class="h5 font-bold">Select version</div>
      </div>
      <!-- Step progress indicator: shows selected project and model -->
      <div
        v-if="selectedProject"
        class="mt-2 absolute rounded-b-md shadow bg-foundation-2 h-10 w-full -ml-6 text-foreground-2 text-sm font-normal px-4 flex items-center min-w-0"
      >
        <button
          v-tippy="'Change project'"
          :class="`hover:text-primary transition truncate text-ellipsis max-w-32 min-w-0 ${
            step === 1 ? 'text-primary font-bold' : ''
          }`"
          @click="step = 1"
        >
          {{ selectedProject ? selectedProject.name : 'No project' }}
        </button>
        <ChevronRightIcon v-if="selectedModel" class="w-4 mt-[2px]" />
        <button
          v-if="selectedModel"
          v-tippy="'Change model'"
          :class="`hover:text-primary transition truncate text-ellipsis max-w-32 min-w-0 ${
            step === 2 ? 'text-primary font-bold' : ''
          }`"
          @click="step = 2"
        >
          {{ selectedModel ? selectedModel.name : 'No model' }}
        </button>
      </div>
    </template>
    <div>
      <div v-if="step === 1">
        <WizardProjectSelector
          :show-new-project="false"
          @next="selectProject"
          @search-text-update="updateSearchText"
        />
      </div>
      <div v-if="step === 2 && selectedProject && selectedAccountId" class="mt-10">
        <div>
          <WizardModelSelector
            :project="selectedProject"
            :account-id="selectedAccountId"
            :show-new-model="false"
            @next="selectModel"
          />
        </div>
      </div>
      <div v-if="step === 3" class="mt-10">
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
  </LayoutDialog>
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
import { ChevronRightIcon } from '@heroicons/vue/24/solid'
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

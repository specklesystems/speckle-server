<template>
  <LayoutDialog
    v-model:open="showReceiveDialog"
    chromium65-compatibility
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
        class="mt-1 absolute rounded-b-md shadow bg-foundation-2 h-10 w-full -ml-4 text-foreground-2 text-sm font-normal px-4 flex items-center min-w-0"
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
        <WizardProjectSelector :show-new-project="false" @next="selectProject" />
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
          @next="selectVersionAndAddModel"
        />
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import {
  ModelListModelItemFragment,
  ProjectListProjectItemFragment,
  VersionListItemFragment
} from '~/lib/common/generated/gql/graphql'
import { useHostAppStore } from '~/store/hostApp'
import { useAccountStore } from '~/store/accounts'
import { ChevronRightIcon } from '@heroicons/vue/24/solid'
import { ReceiverModelCard } from '~/lib/models/card/receiver'
import { useMixpanel } from '~/lib/core/composables/mixpanel'

const { trackEvent } = useMixpanel()
const app = useNuxtApp()

const showReceiveDialog = defineModel({ default: false })

app.$baseBinding.on('documentChanged', () => {
  showReceiveDialog.value = false
})

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
const { defaultAccount } = storeToRefs(accountStore)

const selectedAccountId = ref<string>(defaultAccount.value?.accountInfo.id as string)
const selectedProject = ref<ProjectListProjectItemFragment>()
const selectedModel = ref<ModelListModelItemFragment>()

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

const selectVersionAndAddModel = async (
  version: VersionListItemFragment,
  latestVersion: VersionListItemFragment
) => {
  const modelCard = new ReceiverModelCard()
  modelCard.accountId = selectedAccountId.value
  modelCard.projectId = selectedProject.value?.id as string
  modelCard.modelId = selectedModel.value?.id as string

  modelCard.projectName = selectedProject.value?.name as string
  modelCard.modelName = selectedModel.value?.name as string

  modelCard.selectedVersionId = version.id
  modelCard.latestVersionId = latestVersion.id

  modelCard.hasDismissedUpdateWarning = true
  modelCard.hasSelectedOldVersion = version.id !== latestVersion.id

  void trackEvent('DUI3 Action', {
    name: 'Load Wizard',
    step: 'version selected',
    hasSelectedLatestVersion: version.id === latestVersion.id
  })

  emit('close')
  await hostAppStore.addModel(modelCard)
  await hostAppStore.receiveModel(modelCard.modelCardId)
}

const hostAppStore = useHostAppStore()
</script>

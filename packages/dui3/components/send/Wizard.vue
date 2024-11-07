<template>
  <LayoutDialog
    v-model:open="showSendDialog"
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
        <div v-if="step === 3" class="h5 font-bold">Select objects</div>
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
    <!-- Project selector wizard -->
    <div v-if="step === 1">
      <WizardProjectSelector
        disable-no-write-access-projects
        @next="selectProject"
        @search-text-update="updateSearchText"
      />
    </div>
    <!-- Model selector wizard -->
    <div v-if="step === 2 && selectedProject && selectedAccountId" class="mt-10">
      <WizardModelSelector
        :project="selectedProject"
        :account-id="selectedAccountId"
        @next="selectModel"
      />
    </div>
    <!-- Version selector wizard -->
    <div v-if="step === 3" class="mt-10">
      <SendFiltersAndSettings
        v-model="filter"
        @update:filter="(f) => (filter = f)"
        @update:settings="(s) => (settings = s)"
      />
      <div class="mt-2">
        <FormButton full-width @click="addModel">Publish</FormButton>
      </div>
    </div>
    <div v-if="urlParseError" class="p-2 text-xs text-danger">{{ urlParseError }}</div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type {
  ModelListModelItemFragment,
  ProjectListProjectItemFragment
} from '~/lib/common/generated/gql/graphql'
import type { ISendFilter } from '~/lib/models/card/send'
import { RevitSenderModelCard, SenderModelCard } from '~/lib/models/card/send'
import { useHostAppStore } from '~/store/hostApp'
import { useAccountStore } from '~/store/accounts'
import { ChevronRightIcon } from '@heroicons/vue/24/solid'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import type { CardSetting } from '~/lib/models/card/setting'
import { useAddByUrl } from '~/lib/core/composables/addByUrl'

const { trackEvent } = useMixpanel()

const showSendDialog = defineModel<boolean>({ default: false })

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

  const model =
    hostAppStore.hostAppName === 'revit'
      ? new RevitSenderModelCard()
      : new SenderModelCard()
  model.accountId = selectedAccountId.value
  model.serverUrl = activeAccount.value?.accountInfo.serverInfo.url as string
  model.projectId = selectedProject.value?.id as string
  model.modelId = selectedModel.value?.id as string
  model.workspaceId = selectedProject.value?.workspaceId as string
  model.sendFilter = filter.value as ISendFilter
  model.settings = settings.value
  model.expired = false

  emit('close')
  await hostAppStore.addModel(model)
  void hostAppStore.sendModel(model.modelCardId, 'Wizard')
}
</script>

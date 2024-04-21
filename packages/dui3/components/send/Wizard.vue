<template>
  <LayoutDialog v-model:open="showSendDialog" @fully-closed="step = 1">
    <template #header>
      <div class="flex items-center space-x-2 mb-2">
        <div
          class="text-xs mt-[3px] font-normal bg-primary-muted text-foreground-2 rounded-full justify-center items-center flex px-2"
        >
          {{ step }}/3
        </div>
        <div v-if="step === 1" class="h5 font-bold">Select project</div>
        <div v-if="step === 2" class="h5 font-bold">Select model</div>
        <div v-if="step === 3" class="h5 font-bold">Select objects</div>
      </div>
      <div
        v-if="selectedProject"
        class="absolute rounded-b-md shadow bg-foundation-2 h-6 w-full -ml-4 text-xs text-foreground-2 font-normal px-4 flex items-center min-w-0"
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
        <ChevronRightIcon v-if="selectedModel" class="w-4" />
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
      <!-- Project selector wizard -->
      <div v-if="step === 1">
        <WizardProjectSelector @next="selectProject" />
      </div>
      <!-- Model selector wizard -->
      <div v-if="step === 2 && selectedProject && selectedAccountId" class="mt-4">
        <div>
          <WizardModelSelector
            :project="selectedProject"
            :account-id="selectedAccountId"
            @next="selectModel"
          />
        </div>
      </div>
      <!-- Version selector wizard -->
      <div v-if="step === 3" class="mt-4">
        <SendFiltersAndSettings v-model="filter" @update:filter="(f) => (filter = f)" />
        <div class="mt-2">
          <FormButton full-width @click="addModel">Publish</FormButton>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import {
  ModelListModelItemFragment,
  ProjectListProjectItemFragment
} from '~/lib/common/generated/gql/graphql'
import { ISendFilter, SenderModelCard } from '~/lib/models/card/send'
import { useHostAppStore } from '~/store/hostApp'
import { useAccountStore } from '~/store/accounts'
import { CloudArrowUpIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/vue/24/solid'

const showSendDialog = defineModel({ default: false })

const emit = defineEmits(['close'])

const step = ref(1)
const accountStore = useAccountStore()
const { defaultAccount } = storeToRefs(accountStore)

const selectedAccountId = ref<string>(defaultAccount.value?.accountInfo.id as string)
const selectedProject = ref<ProjectListProjectItemFragment>()
const selectedModel = ref<ModelListModelItemFragment>()
const filter = ref<ISendFilter | undefined>(undefined)

const selectProject = (accountId: string, project: ProjectListProjectItemFragment) => {
  step.value++
  selectedAccountId.value = accountId
  selectedProject.value = project
}

const selectModel = (model: ModelListModelItemFragment) => {
  step.value++
  selectedModel.value = model
}

watch(step, (newVal, oldVal) => {
  if (newVal > oldVal) return
  if (newVal === 1) {
    selectedProject.value = undefined
    selectedModel.value = undefined
  }
  if (newVal === 2) selectedModel.value = undefined
})

const hostAppStore = useHostAppStore()

const addModel = async () => {
  const model = new SenderModelCard()
  model.accountId = selectedAccountId.value
  model.projectId = selectedProject.value?.id as string
  model.modelId = selectedModel.value?.id as string
  model.sendFilter = filter.value as ISendFilter
  model.expired = false

  emit('close')
  await hostAppStore.addModel(model)
  void hostAppStore.sendModel(model.modelCardId)
}
</script>

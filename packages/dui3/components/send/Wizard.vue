<template>
  <div>
    <div class="-mt-4 mb-4 flex items-center justify-center space-x-2">
      <div
        v-for="index in 3"
        :key="index"
        :class="`rounded-full h-2 w-2 ${
          index === step ? 'bg-primary' : 'bg-foreground-2'
        }`"
      ></div>
    </div>
    <div v-if="step === 1">
      <div>
        <div class="h5 font-bold">Select Project</div>
      </div>
      <SendProjectSelector @next="selectProject" />
    </div>
    <div v-if="step === 2 && selectedProject && selectedAccountId">
      <div class="flex items-center justify-between mb-2">
        <div class="h5 font-bold">Select Model</div>
        <FormButton v-if="step > 1" size="xs" class="-ml-1" text @click="step--">
          Back
        </FormButton>
      </div>
      <div>
        <SendModelSelector
          :project="selectedProject"
          :account-id="selectedAccountId"
          @next="selectModel"
        />
      </div>
    </div>
    <div v-if="step === 3">
      <div class="flex items-center justify-between mb-2">
        <div class="h5 font-bold">Send Filter</div>
        <FormButton v-if="step > 1" size="xs" class="-ml-1" text @click="step--">
          Back
        </FormButton>
      </div>
      <SendFiltersAndSettings v-model="filter" />
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  ModelListModelItemFragment,
  ProjectListProjectItemFragment
} from 'lib/common/generated/gql/graphql'
import { ISendFilter } from 'lib/models/card/send'

const step = ref(1)
const selectedAccountId = ref<string | null>()
const selectedProject = ref<ProjectListProjectItemFragment>()
const selectedModel = ref<ModelListModelItemFragment>()
const filter = ref<ISendFilter>()

const selectProject = (accountId: string, project: ProjectListProjectItemFragment) => {
  step.value++
  selectedAccountId.value = accountId
  selectedProject.value = project
}

const selectModel = (model: ModelListModelItemFragment) => {
  step.value++
  selectedModel.value = model
}
</script>

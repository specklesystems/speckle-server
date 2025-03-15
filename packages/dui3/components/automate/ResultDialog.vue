<template>
  <div class="p-0">
    <slot name="activator" :toggle="toggleDialog"></slot>
    <CommonDialog
      v-model:open="showAutomateReportDialog"
      :title="`Automation Report`"
      fullscreen="none"
    >
      <div v-if="props.automationRuns" class="space-y-2">
        <AutomateFunctionRunsRows
          v-for="aRun in automationRuns"
          :key="aRun.id"
          :model-card="modelCard"
          :automation-name="aRun.automation.name"
          :runs="aRun.functionRuns"
          :project-id="modelCard.projectId"
          :model-id="modelId"
        />
      </div>
    </CommonDialog>
  </div>
</template>

<script setup lang="ts">
import type { IModelCard } from '~/lib/models/card'
import type { AutomationRunItemFragment } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  modelCard: IModelCard
  modelId: string
  automationRuns: AutomationRunItemFragment[] | undefined
}>()

const showAutomateReportDialog = ref(false)

const toggleDialog = () => {
  showAutomateReportDialog.value = !showAutomateReportDialog.value
}
</script>

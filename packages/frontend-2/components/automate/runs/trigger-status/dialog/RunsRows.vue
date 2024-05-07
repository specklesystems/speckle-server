<template>
  <div class="space-y-2">
    <AutomateRunsTriggerStatusDialogFunctionRun
      v-for="fRun in runs"
      :key="fRun.id"
      :automation-name="fRun.automationName"
      :function-run="fRun"
      :project-id="projectId"
      :model-id="modelId"
      :version-id="versionId"
    />
  </div>
</template>
<script setup lang="ts">
import { useAutomationsStatusOrderedRuns } from '~/lib/automate/composables/runs'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateRunsTriggerStatusDialogRunsRows_AutomateRunFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment AutomateRunsTriggerStatusDialogRunsRows_AutomateRun on AutomateRun {
    id
    functionRuns {
      id
      ...AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun
    }
    ...AutomationsStatusOrderedRuns_AutomationRun
  }
`)

const props = defineProps<{
  runs: AutomateRunsTriggerStatusDialogRunsRows_AutomateRunFragment[]
  projectId: string
  modelId: string
  versionId?: string
}>()

const { runs } = useAutomationsStatusOrderedRuns({
  automationRuns: computed(() => props.runs)
})
</script>

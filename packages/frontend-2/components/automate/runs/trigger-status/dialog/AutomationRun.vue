<template>
  <div class="space-y-2">
    <AutomateRunsTriggerStatusDialogFunctionRun
      v-for="fRun in run.functionRuns"
      :key="fRun.id"
      :automation-name="run.automation.name"
      :function-run="fRun"
      :project-id="projectId"
      :model-id="modelId"
      :version-id="versionId"
    />
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateRunsTriggerStatusDialogAutomationRun_AutomateRunFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment AutomateRunsTriggerStatusDialogAutomationRun_AutomateRun on AutomateRun {
    id
    automation {
      name
    }
    functionRuns {
      id
      ...AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun
    }
  }
`)

defineProps<{
  run: AutomateRunsTriggerStatusDialogAutomationRun_AutomateRunFragment
  projectId: string
  modelId: string
  versionId?: string
}>()
</script>

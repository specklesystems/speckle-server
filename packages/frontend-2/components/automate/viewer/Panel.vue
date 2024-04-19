<template>
  <div>
    <ViewerLayoutPanel @close="$emit('close')">
      <template #title>Automate</template>

      <div class="flex items-center space-x-2 w-full pl-3 mt-2">
        <div class="mt-[6px]">
          <AutomateRunsTriggerStatusIcon :summary="summary" class="h-6 w-6" />
        </div>
        <div class="min-w-0">
          <h4 :class="`text-sm font-bold ${summary.titleColor}`">
            {{ summary.title }}
          </h4>
          <div class="text-xs text-foreground-2 truncate">
            {{ summary.longSummary }}
          </div>
        </div>
      </div>
      <div class="relative flex flex-col space-y-2 p-2">
        <template v-for="automationRun in automationRuns" :key="automationRun.id">
          <template v-for="run in automationRun.functionRuns" :key="run.id">
            <AutomateViewerPanelFunctionRunRow
              :function-run="run"
              :automation-name="automationRun.automation.name"
            />
          </template>
        </template>
      </div>
    </ViewerLayoutPanel>
  </div>
</template>
<script setup lang="ts">
import { type RunsStatusSummary } from '~/lib/automate/composables/runStatus'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateViewerPanel_AutomateRunFragment } from '~~/lib/common/generated/gql/graphql'

// TODO: Subscriptions

graphql(`
  fragment AutomateViewerPanel_AutomateRun on AutomateRun {
    id
    automation {
      id
      name
    }
    functionRuns {
      id
      ...AutomateViewerPanelFunctionRunRow_AutomateFunctionRun
    }
  }
`)

defineEmits(['close'])

defineProps<{
  automationRuns: AutomateViewerPanel_AutomateRunFragment[]
  summary: RunsStatusSummary
}>()
</script>

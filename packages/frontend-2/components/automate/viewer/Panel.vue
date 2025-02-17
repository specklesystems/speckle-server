<template>
  <div>
    <ViewerLayoutPanel @close="$emit('close')">
      <template #title>Automate</template>

      <div class="flex items-center space-x-2 w-full pl-3 mt-3 mb-1">
        <AutomateRunsTriggerStatusIcon :summary="summary" class="h-6 w-6" />
        <div class="flex min-w-0 flex-col gap-0.5">
          <h4 class="text-heading-sm" :class="[summary.titleColor]">
            {{ summary.title }}
          </h4>
          <div class="text-body-2xs text-foreground-2">
            {{ summary.longSummary }}
          </div>
        </div>
      </div>
      <div class="relative flex flex-col space-y-2 p-2">
        <AutomateViewerPanelFunctionRunRow
          v-for="run in runs"
          :key="run.id"
          :function-run="run"
          :automation-name="run.automationName"
        />
      </div>
    </ViewerLayoutPanel>
  </div>
</template>
<script setup lang="ts">
import { type RunsStatusSummary } from '~/lib/automate/composables/runStatus'
import { useAutomationsStatusOrderedRuns } from '~/lib/automate/composables/runs'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateViewerPanel_AutomateRunFragment } from '~~/lib/common/generated/gql/graphql'

// TODO: Subscriptions

graphql(`
  fragment AutomateViewerPanel_AutomateRun on AutomateRun {
    id
    functionRuns {
      id
      ...AutomateViewerPanelFunctionRunRow_AutomateFunctionRun
    }
    ...AutomationsStatusOrderedRuns_AutomationRun
  }
`)

defineEmits(['close'])

const props = defineProps<{
  automationRuns: AutomateViewerPanel_AutomateRunFragment[]
  summary: RunsStatusSummary
}>()

const { runs } = useAutomationsStatusOrderedRuns({
  automationRuns: computed(() => props.automationRuns)
})
</script>

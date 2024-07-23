<template>
  <div>
    <ViewerLayoutPanel @close="$emit('close')">
      <template #title>Automate</template>

      <div class="flex items-center space-x-2 w-full pl-3 mt-2">
        <div class="mt-[6px] shrink-0">
          <AutomateRunsTriggerStatusIcon :summary="summary" class="h-6 w-6" />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <h4 :class="[`label font-medium whitespace-normal`, summary.titleColor]">
            {{ summary.title }}
          </h4>
          <div class="caption text-foreground-2 whitespace-normal">
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

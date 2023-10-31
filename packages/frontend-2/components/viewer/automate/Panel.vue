<template>
  <div>
    <ViewerLayoutPanel @close="$emit('close')">
      <template #actions>
        <!-- TODO: Use new title slot once Andrew's PR is in -->
        <FormButton size="xs" text>Automate</FormButton>
      </template>
      <div class="flex items-center space-x-2 w-full pl-3 mt-2">
        <div class="h-6 w-6 mt-[6px]">
          <AutomationDoughnutSummary :summary="summary" />
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
        <template v-for="automationRun in automationRuns">
          <template v-for="run in automationRun.functionRuns" :key="run.id">
            <AutomationViewerFunctionRunItem
              v-if="
                run.results &&
                run.results.values &&
                run.results.values.objectResults &&
                run.results.values.objectResults.length !== 0
              "
              :function-run="run"
              :automation-name="automationRun.automationName"
            />
          </template>
        </template>
      </div>
    </ViewerLayoutPanel>
  </div>
</template>
<script setup lang="ts">
import {
  AutomationFunctionRun,
  AutomationRun
} from '~~/lib/common/generated/gql/graphql'

defineEmits(['close'])

defineProps<{
  summary: {
    failed: number
    passed: number
    inProgress: number
    total: number
    title: string
    titleColor: string
    longSummary: string
  }
  functionRuns: AutomationFunctionRun[]
  automationRuns: AutomationRun[]
}>()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type RemoveOnceBEIsHappy = AutomationFunctionRun & {
  results: { values: { blobIds: string[] } }
}
</script>

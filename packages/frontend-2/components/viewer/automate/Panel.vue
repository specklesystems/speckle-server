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
        <!-- NOTE: N/a as i'm now displaying all runs -->
        <!-- <div class="text-xs my-4 px-1">
          TODO: Display a message informing whether we've hidden any run results (e.g.,
          from function runs that are inprogress? )
        </div> -->
        <template v-for="automationRun in automationRuns">
          <template v-for="run in automationRun.functionRuns" :key="run.id">
            <AutomationViewerFunctionRunItem
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
import { useModelVersionCardAutomationsStatusUpdateTracking } from '~~/lib/automations/composables/automationsStatus'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

const { projectId } = useInjectedViewerState()
// NOTE: test if this actually works
useModelVersionCardAutomationsStatusUpdateTracking(projectId)

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
</script>

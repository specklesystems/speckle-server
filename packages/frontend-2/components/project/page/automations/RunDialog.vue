<template>
  <LayoutDialog
    v-model:open="open"
    :buttons="[
      {
        text: 'Close',
        onClick: () => {
          open = false
        },
        props: { color: 'outline', fullWidth: true }
      },
      ...(run && projectId && run.trigger.model && run.trigger.version
        ? [
            {
              text: 'View Model Version',
              props: {
                fullWidth: true,
                to: versionUrl({
                  projectId,
                  modelId: run.trigger.model.id,
                  versionId: run.trigger.version.id
                })
              }
            }
          ]
        : [])
    ]"
  >
    <template #header>
      <div class="flex flex-col">
        <div class="flex items-center space-x-2 max-w-full w-full">
          <div class="mt-[6px] shrink-0">
            <AutomateRunsTriggerStatusIcon
              :summary="summary"
              class="h-6 w-6 sm:h-10 sm:w-10"
            />
          </div>
          <div>Run Details</div>
        </div>
      </div>
    </template>
    <div v-if="run && projectId && automationId" class="flex flex-col gap-2">
      <div class="grid gap-2 grid-cols-[auto,1fr] items-center">
        <div class="font-medium">Run ID:</div>
        <div>{{ run.id }}</div>
        <div class="font-medium">Status:</div>
        <AutomateRunsStatusBadge :run="run" />
        <template v-if="summary.errorMessage">
          <div class="font-medium">Error:</div>
          <div>{{ summary.errorMessage }}</div>
        </template>
        <div class="font-medium">Time started:</div>
        <div>{{ runDate(run) }}</div>
        <div class="font-medium">Duration:</div>
        <div>{{ runDuration(run) }}</div>
        <div class="font-medium">Log output:</div>
        <CommonLoadingIcon v-if="showLoader" size="sm" />
      </div>
      <div class="flex flex-col gap-2">
        <CommonCodeOutput :content="codeOutputContent" />
      </div>
    </div>
    <div v-else />
  </LayoutDialog>
</template>
<script setup lang="ts">
import {
  useAutomationRunDetailsFns,
  useAutomationRunLogs,
  useAutomationRunSummary
} from '~/lib/automate/composables/runs'
import type { AutomationRunDetailsFragment } from '~/lib/common/generated/gql/graphql'
import { useViewerRouteBuilder } from '~/lib/projects/composables/models'

const props = defineProps<{
  // These are optional so that we can mount the dialog even before we have selected
  // a run to display
  run?: AutomationRunDetailsFragment
  projectId?: string
  automationId?: string
}>()

const open = defineModel<boolean>('open', { required: true })
const { versionUrl } = useViewerRouteBuilder()

const { summary } = useAutomationRunSummary({ run: computed(() => props.run) })
const { runDate, runDuration } = useAutomationRunDetailsFns()
const {
  data: logsData,
  isDataLoaded: areLogsFullyRead,
  loading: logsLoading
} = useAutomationRunLogs({
  automationId: computed(() => props.automationId),
  runId: computed(() => props.run?.id)
})

const showLoader = computed(() => logsLoading.value || !areLogsFullyRead.value)
const codeOutputContent = computed(() => {
  if (logsData.value) {
    return logsData.value
  }

  if (areLogsFullyRead.value) {
    return 'No logs found'
  }

  return ''
})
</script>

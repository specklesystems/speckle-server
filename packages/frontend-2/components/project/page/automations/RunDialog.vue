<template>
  <LayoutDialog
    v-model:open="open"
    title="Run Details"
    :buttons="[
      {
        text: 'Close',
        onClick: () => {
          open = false
        },
        props: { color: 'secondary', fullWidth: true }
      },
      {
        text: 'View Model Version',
        props: {
          fullWidth: true,
          to:
            run && projectId && modelId
              ? versionUrl({ projectId, modelId, versionId: run.version.id })
              : undefined
        }
      }
    ]"
  >
    <div v-if="run && modelId && projectId && automationId" class="flex flex-col gap-2">
      <div class="grid gap-2 grid-cols-[auto,1fr] items-center">
        <div class="font-bold">Run:</div>
        <div>{{ run.id }}</div>
        <div class="font-bold">Status:</div>
        <AutomationsRunsStatusBadge :run="run" />
        <div class="font-bold">Time started:</div>
        <div>{{ runDate(run) }}</div>
        <div class="font-bold">Duration:</div>
        <div>{{ runDuration(run) }}</div>
        <div class="font-bold">Log output:</div>
        <CommonLoadingIcon v-if="showLoader" size="sm" />
      </div>
      <div class="flex flex-col gap-2">
        <div>
          <CommonCodeOutput v-if="logsData?.length" :content="logsData" />
          <span v-else-if="areLogsFullyRead" class="italic">No logs found</span>
        </div>
      </div>
    </div>
    <div v-else />
  </LayoutDialog>
</template>
<script setup lang="ts">
import {
  useAutomationRunDetailsFns,
  useAutomationRunLogs
} from '~/lib/automations/composables/runs'
import type { AutomationRunDetailsFragment } from '~/lib/common/generated/gql/graphql'
import { useViewerRouteBuilder } from '~/lib/projects/composables/models'

const props = defineProps<{
  // These are optional so that we can mount the dialog even before we have selected
  // a run to display
  run?: AutomationRunDetailsFragment
  projectId?: string
  modelId?: string
  automationId?: string
}>()

const open = defineModel<boolean>('open', { required: true })
const { versionUrl } = useViewerRouteBuilder()

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
</script>

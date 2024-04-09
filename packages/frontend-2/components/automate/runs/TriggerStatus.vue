<template>
  <div v-if="summary && status" @click.stop.prevent>
    <button
      v-tippy="summary.longSummary"
      class="h-6 w-6 bg-foundation rounded-full flex items-center justify-center"
      @click="showDialog = true"
    >
      <AutomateRunsTriggerStatusIcon :summary="summary" />
    </button>
    <AutomateRunsTriggerStatusDialog
      v-model:open="showDialog"
      :status="status"
      :summary="summary"
      :project-id="projectId"
      :model-id="modelId"
      :version-id="versionId"
    />
  </div>
  <div v-else />
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { useRunsSummary } from '~/lib/automate/composables/runStatus'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateRunsTriggerStatus_TriggeredAutomationsStatusFragment } from '~/lib/common/generated/gql/graphql'

// TODO: Subscriptions?
// TODO: Delete old components

graphql(`
  fragment AutomateRunsTriggerStatus_TriggeredAutomationsStatus on TriggeredAutomationsStatus {
    id
    ...TriggeredAutomationsStatusSummary
    ...AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus
  }
`)

const props = defineProps<{
  status: MaybeNullOrUndefined<AutomateRunsTriggerStatus_TriggeredAutomationsStatusFragment>
  projectId: string
  modelId: string
  versionId?: string
}>()

const { summary } = useRunsSummary({
  status: computed(() => props.status)
})

const showDialog = ref(false)
</script>

<template>
  <div v-if="status" v-tippy="summary.longSummary" @click.stop.prevent @mousemove.stop>
    <button
      class="rounded-full flex items-center justify-center outline-none"
      @click="onClick"
    >
      <AutomateRunsTriggerStatusIcon :summary="summary" class="h-6 w-6 m-3" />
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
import { useAutomationsStatusRunsSummary } from '~/lib/automate/composables/runStatus'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateRunsTriggerStatus_TriggeredAutomationsStatusFragment } from '~/lib/common/generated/gql/graphql'

// TODO: Subscriptions?

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

const { summary } = useAutomationsStatusRunsSummary({
  status: computed(() => props.status)
})

const showDialog = ref(false)

const onClick = () => {
  showDialog.value = true
}
</script>

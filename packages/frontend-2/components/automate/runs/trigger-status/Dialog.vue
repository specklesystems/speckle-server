<template>
  <LayoutDialog v-model:open="showDialog" max-width="lg">
    <template #header>
      <div class="flex flex-col">
        <div class="flex items-center space-x-2 max-w-full w-full">
          <div class="h-10 w-10 mt-[6px]">
            <AutomateRunsTriggerStatusIcon :summary="summary" />
          </div>
          <div class="min-w-0">
            <h4 :class="`text-xl font-bold ${summary.titleColor}`">
              {{ summary.title }}
            </h4>
            <div class="text-xs text-foreground-2 truncate">
              {{ summary.longSummary }}
            </div>
          </div>
        </div>
      </div>
    </template>
    <div>
      <div v-for="run in status.automationRuns" :key="run.id">
        <AutomateRunsTriggerStatusDialogAutomationRun
          :run="run"
          :project-id="projectId"
          :model-id="modelId"
          :version-id="versionId"
        />
      </div>
    </div>

    <template #buttons>
      <div class="flex w-full justify-between items-center pl-2">
        <FormButton
          text
          size="xs"
          target="_blank"
          external
          to="https://speckle.systems/blog/automate-with-speckle/"
        >
          Learn more about Automate here!
        </FormButton>
        <div class="space-x-1">
          <FormButton color="secondary" @click="showDialog = false">Close</FormButton>
          <FormButton :to="viewUrl">
            Open {{ versionId ? 'Version' : 'Model' }}
          </FormButton>
        </div>
      </div>
    </template>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { SpeckleViewer } from '@speckle/shared'
import type { RunsStatusSummary } from '~/lib/automate/composables/runStatus'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatusFragment } from '~/lib/common/generated/gql/graphql'
import { modelRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatus on TriggeredAutomationsStatus {
    id
    automationRuns {
      id
      ...AutomateRunsTriggerStatusDialogAutomationRun_AutomateRun
    }
  }
`)

const props = defineProps<{
  status: AutomateRunsTriggerStatusDialog_TriggeredAutomationsStatusFragment
  summary: RunsStatusSummary
  projectId: string
  modelId: string
  versionId?: string
}>()

const showDialog = defineModel<boolean>('open', { required: true })

const viewUrl = computed(() => {
  const resourceIdStringBuilder = SpeckleViewer.ViewerRoute.resourceBuilder()
  resourceIdStringBuilder.addModel(props.modelId, props.versionId)
  return modelRoute(props.projectId, resourceIdStringBuilder.toString())
})
</script>

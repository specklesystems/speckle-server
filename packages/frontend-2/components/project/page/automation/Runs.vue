<template>
  <div class="flex flex-col w-full">
    <div class="flex items-center justify-between h-6 mb-6">
      <h2 class="h6 font-bold">Runs</h2>
      <FormButton
        :icon-left="ArrowPathIcon"
        :disabled="!automation.enabled"
        @click="onTrigger"
      >
        Trigger Automation
      </FormButton>
    </div>
    <AutomateRunsTable
      :runs="automation.runs.items"
      :project-id="projectId"
      :automation-id="automation.id"
    />
  </div>
</template>
<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectPageAutomationRuns_AutomationFragment } from '~/lib/common/generated/gql/graphql'
import { useTriggerAutomation } from '~/lib/projects/composables/automationManagement'

// TODO: Pagination
// TODO: Subscriptions for new runs

graphql(`
  fragment ProjectPageAutomationRuns_Automation on Automation {
    id
    enabled
    runs {
      items {
        ...AutomationRunDetails
      }
    }
  }
`)

const props = defineProps<{
  automation: ProjectPageAutomationRuns_AutomationFragment
  projectId: string
}>()

const triggerAutomation = useTriggerAutomation()

const onTrigger = () => {
  triggerAutomation(props.projectId, props.automation.id)
}
</script>

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
import { useMixpanel } from '~/lib/core/composables/mp'
import { useTriggerAutomation } from '~/lib/projects/composables/automationManagement'

// TODO: Pagination
// TODO: Subscriptions for new runs

graphql(`
  fragment ProjectPageAutomationRuns_Automation on Automation {
    id
    name
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
const mixpanel = useMixpanel()

const onTrigger = async () => {
  const res = await triggerAutomation(props.projectId, props.automation.id)
  if (res) {
    mixpanel.track('Automation Run Triggered', {
      automationId: props.automation.id,
      automationName: props.automation.name,
      projectId: props.projectId,
      manual: true
    })
  }
}
</script>

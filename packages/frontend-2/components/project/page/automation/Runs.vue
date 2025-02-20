<template>
  <div class="flex flex-col w-full">
    <div class="flex items-center justify-between h-6 mb-6">
      <h2 class="h6 font-medium">Runs</h2>
      <FormButton
        v-if="!automation.isTestAutomation && isEditable"
        :disabled="!automation.enabled"
        @click="onTrigger"
      >
        Trigger automation
      </FormButton>
    </div>
    <AutomateRunsTable
      :runs="automation.runs.items"
      :project-id="projectId"
      :automation-id="automation.id"
    />
    <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />
  </div>
</template>
<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectPageAutomationRuns_AutomationFragment } from '~/lib/common/generated/gql/graphql'
import { useTriggerAutomation } from '~/lib/projects/composables/automationManagement'
import { projectAutomationPagePaginatedRunsQuery } from '~/lib/projects/graphql/queries'

// TODO: Subscriptions for new runs

graphql(`
  fragment ProjectPageAutomationRuns_Automation on Automation {
    id
    name
    enabled
    isTestAutomation
    runs(limit: 10) {
      items {
        ...AutomationRunDetails
      }
      totalCount
      cursor
    }
  }
`)

const props = defineProps<{
  automation: ProjectPageAutomationRuns_AutomationFragment
  projectId: string
  isEditable: boolean
}>()

const { identifier, onInfiniteLoad } = usePaginatedQuery({
  query: projectAutomationPagePaginatedRunsQuery,
  baseVariables: computed(() => ({
    projectId: props.projectId,
    automationId: props.automation.id,
    cursor: null as Nullable<string>
  })),
  resolveKey: (vars) => [vars.projectId, vars.automationId],
  resolveCurrentResult: (res) => res?.project?.automation?.runs,
  resolveInitialResult: () => props.automation.runs,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})
const triggerAutomation = useTriggerAutomation()

const onTrigger = async () => {
  await triggerAutomation(props.projectId, props.automation.id)
}
</script>

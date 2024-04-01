<template>
  <div class="flex flex-col w-full">
    <div class="flex items-center justify-between">
      <h2 class="h6 font-bold">Runs</h2>
      <FormButton :icon-left="ArrowPathIcon">Trigger Automation</FormButton>
    </div>
    <AutomationsRunsTable
      class="mt-3"
      :runs="automation.runs.items"
      :project-id="projectId"
      :model-id="automation.model.id"
      :automation-id="automation.id"
    />
  </div>
</template>
<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectPageAutomationRuns_AutomationFragment } from '~/lib/common/generated/gql/graphql'

// TODO: Pagination

graphql(`
  fragment ProjectPageAutomationRuns_Automation on Automation {
    id
    runs {
      items {
        ...AutomationRunDetails
      }
    }
    model {
      id
    }
  }
`)

defineProps<{
  automation: ProjectPageAutomationRuns_AutomationFragment
  projectId: string
}>()
</script>

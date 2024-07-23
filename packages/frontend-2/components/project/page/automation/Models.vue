<template>
  <div class="col-span-1">
    <h2 class="h6 font-medium mb-6">Model</h2>
    <div class="w-full">
      <ProjectModelsBasicCardView
        v-if="triggerModels.length"
        :items="triggerModels"
        vertical
        :project="project"
        :project-id="project.id"
      />
      <CommonGenericEmptyState
        v-else
        message="No valid models found for this automation. They may have been deleted."
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { isNonNullable } from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql'
import type {
  ProjectPageAutomationHeader_AutomationFragment,
  ProjectPageAutomationHeader_ProjectFragment
} from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageAutomationHeader_Automation on Automation {
    id
    name
    enabled
    isTestAutomation
    currentRevision {
      id
      triggerDefinitions {
        ... on VersionCreatedTriggerDefinition {
          model {
            ...ProjectPageLatestItemsModelItem
          }
        }
      }
    }
  }
`)

graphql(`
  fragment ProjectPageAutomationHeader_Project on Project {
    id
    ...ProjectPageModelsCardProject
  }
`)

const props = defineProps<{
  project: ProjectPageAutomationHeader_ProjectFragment
  automation: ProjectPageAutomationHeader_AutomationFragment
}>()

const triggerModels = computed(
  () =>
    props.automation.currentRevision?.triggerDefinitions
      .map((t) => t.model)
      .filter(isNonNullable) || []
)
</script>

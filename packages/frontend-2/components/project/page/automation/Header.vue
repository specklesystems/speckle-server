<template>
  <div class="flex flex-col items-start w-full">
    <CommonTextLink :icon-left="ArrowLeftIcon" size="xs" :to="automationsLink">
      Go Back to Automations
    </CommonTextLink>
    <div class="flex gap-1 items-center relative">
      <h1 class="block h4 font-bold">Automations</h1>
      <ChevronRightIcon class="w-5 h-5" />
      <CommonEditableTitle
        v-model="name"
        :custom-classes="{
          input: 'h4 font-bold',
          pencil: 'ml-2 mt-2 w-4 h-4'
        }"
        class="relative top-1.5"
      />
    </div>
    <ProjectModelsBasicCardView
      :items="triggerModels"
      :project="project"
      :project-id="project.id"
      class="mt-6 w-full"
    />
  </div>
</template>
<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { ChevronRightIcon } from '@heroicons/vue/24/solid'
import { graphql } from '~/lib/common/generated/gql'
import type {
  ProjectPageAutomationHeader_AutomationFragment,
  ProjectPageAutomationHeader_ProjectFragment
} from '~/lib/common/generated/gql/graphql'
import { projectRoute } from '~/lib/common/helpers/route'
import { useUpdateAutomation } from '~/lib/projects/composables/automationManagement'

graphql(`
  fragment ProjectPageAutomationHeader_Automation on Automation {
    id
    name
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

const updateAutomation = useUpdateAutomation()

const automationsLink = computed(() => projectRoute(props.project.id, 'automations'))
const name = computed({
  get: () => props.automation.name,
  set: async (newVal) => {
    if (newVal === props.automation.name) return

    const args = {
      projectId: props.project.id,
      input: {
        id: props.automation.id,
        name: newVal
      }
    }
    await updateAutomation(args, {
      optimisticResponse: {
        projectMutations: {
          automationMutations: {
            update: {
              id: args.input.id,
              name: args.input.name || props.automation.name
            }
          }
        }
      }
    })
  }
})
const triggerModels = computed(
  () => props.automation.currentRevision?.triggerDefinitions.map((t) => t.model) || []
)
</script>

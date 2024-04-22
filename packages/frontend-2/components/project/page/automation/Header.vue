<template>
  <div class="flex flex-col items-start w-full">
    <div class="flex gap-2 flex-col sm:flex-row sm:justify-between w-full">
      <div class="flex flex-col items-start">
        <CommonTextLink :icon-left="ArrowLeftIcon" size="xs" :to="automationsLink">
          Go Back to Automations
        </CommonTextLink>
        <div class="flex sm:gap-1 flex-col sm:flex-row sm:items-center sm:relative">
          <div class="flex gap-1 items-center">
            <h1 class="block h5 sm:h4 font-bold">Automations</h1>
            <ChevronRightIcon class="w-5 h-5" />
          </div>
          <CommonEditableTitle
            v-model="name"
            :disabled="loading"
            :custom-classes="{
              input: 'h4 font-bold',
              pencil: 'ml-2 mt-2 w-4 h-4'
            }"
            class="relative top-1.5"
          />
        </div>
      </div>
      <FormSwitch
        v-model="enabled"
        name="enabled"
        label="Enabled"
        :disabled="loading"
      />
    </div>
    <div class="mt-6 w-full">
      <ProjectModelsBasicCardView
        v-if="triggerModels.length"
        :items="triggerModels"
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
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { ChevronRightIcon } from '@heroicons/vue/24/solid'
import { FormSwitch } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
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
    enabled
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

const loading = useMutationLoading()
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
              name: args.input.name || props.automation.name,
              enabled: props.automation.enabled
            }
          }
        }
      }
    })
  }
})

const enabled = computed({
  get: () => props.automation.enabled,
  set: async (newVal) => {
    if (newVal === props.automation.enabled) return

    const args = {
      projectId: props.project.id,
      input: {
        id: props.automation.id,
        enabled: newVal
      }
    }
    await updateAutomation(args, {
      optimisticResponse: {
        projectMutations: {
          automationMutations: {
            update: {
              id: args.input.id,
              enabled: args.input.enabled,
              name: props.automation.name
            }
          }
        }
      },
      messages: {
        success: `Automation ${args.input.enabled ? 'enabled' : 'disabled'}`,
        failure: `Failed to ${args.input.enabled ? 'enable' : 'disable'} automation`
      }
    })
  }
})

const triggerModels = computed(
  () => props.automation.currentRevision?.triggerDefinitions.map((t) => t.model) || []
)
</script>

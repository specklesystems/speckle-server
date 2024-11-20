<template>
  <div class="flex flex-col items-start w-full">
    <div class="flex gap-2 flex-col sm:flex-row sm:justify-between w-full">
      <div class="flex flex-col items-start gap-2">
        <CommonTextLink :icon-left="ChevronLeftIcon" size="sm" :to="automationsLink">
          Back to Automations
        </CommonTextLink>
        <div class="flex flow-row justify-start items-center z-20">
          <CommonEditableTitle
            v-model="name"
            :disabled="loading"
            :custom-classes="{
              input: 'h4',
              pencil: 'ml-2 mt-2 w-4 h-4'
            }"
            class="relative top-1.5"
          />
          <div
            v-if="automation.isTestAutomation"
            class="pointer-events-none -translate-x-4 z-10"
          >
            <CommonBadge rounded>Test Automation</CommonBadge>
          </div>
        </div>
      </div>
      <FormSwitch
        v-if="!automation.isTestAutomation"
        :id="switchId"
        v-model="enabled"
        name="enable"
        :label="enabled ? 'Enabled' : 'Disabled'"
        :disabled="loading"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { FormSwitch } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  ProjectPageAutomationHeader_AutomationFragment,
  ProjectPageAutomationHeader_ProjectFragment
} from '~/lib/common/generated/gql/graphql'
import { projectRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useUpdateAutomation } from '~/lib/projects/composables/automationManagement'

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

const switchId = useId()
const loading = useMutationLoading()
const updateAutomation = useUpdateAutomation()
const mixpanel = useMixpanel()

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
    const res = await updateAutomation(args, {
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
    if (res?.id) {
      mixpanel.track('Automation Enabled/Disabled', {
        automationId: res.id,
        automationName: res.name,
        projectId: props.project.id,
        enabled: res.enabled
      })
    }
  }
})
</script>

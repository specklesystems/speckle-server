<template>
  <div class="bg-foundation border border-outline-3 rounded-lg pt-5 px-6 pb-6">
    <div class="flex w-full justify-between items-center mb-2">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex flex-row justify-start items-center gap-2">
          <RouterLink
            class="h5 font-medium text-foreground hover:underline"
            :to="projectAutomationRoute(projectId, automation.id)"
          >
            {{ automation.name }}
          </RouterLink>
          <div>
            <CommonBadge v-if="isTestAutomation" rounded>Test Automation</CommonBadge>
          </div>
        </div>
        <template v-if="!isEnabled">
          <div>
            <CommonBadge rounded color-classes="bg-danger-lighter text-danger-darker">
              Disabled
            </CommonBadge>
          </div>
        </template>
      </div>

      <FormButton
        color="outline"
        size="sm"
        :to="projectAutomationRoute(projectId, automation.id)"
      >
        View details
      </FormButton>
    </div>
    <div class="flex flex-col mb-6">
      <template v-if="triggerModels.length">
        <div class="flex gap-2">
          <div class="mt-1">{{ triggerLabel }}</div>
          <div v-for="model in triggerModels" :key="model.id" class="truncate">
            <CommonTextLink :icon-left="CubeIcon" :to="finalModelUrl(model.id)">
              {{ model.name }}
            </CommonTextLink>
          </div>
        </div>
      </template>
      <div
        v-else
        class="flex items-center gap-1.5 truncate text-foreground-2 text-body-xs"
      >
        <ExclamationTriangleIcon class="w-4 h-4" />
        <span>No valid models are attached to this automation</span>
      </div>
    </div>
    <AutomateRunsTable
      :runs="automation.runs.items.slice(0, 5)"
      :project-id="projectId"
      :automation-id="automation.id"
    />
  </div>
</template>
<script setup lang="ts">
import { CubeIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { isNonNullable } from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql'
import { type ProjectPageAutomationsRow_AutomationFragment } from '~/lib/common/generated/gql/graphql'
import { projectAutomationRoute } from '~/lib/common/helpers/route'
import { useViewerRouteBuilder } from '~/lib/projects/composables/models'

graphql(`
  fragment ProjectPageAutomationsRow_Automation on Automation {
    id
    name
    enabled
    isTestAutomation
    currentRevision {
      id
      triggerDefinitions {
        ... on VersionCreatedTriggerDefinition {
          model {
            id
            name
          }
        }
      }
    }
    runs(limit: 10) {
      totalCount
      items {
        ...AutomationRunDetails
      }
      cursor
    }
  }
`)

const props = defineProps<{
  projectId: string
  automation: ProjectPageAutomationsRow_AutomationFragment
}>()

const { modelUrl } = useViewerRouteBuilder()

const isEnabled = computed(() => props.automation.enabled)
const isTestAutomation = computed(() => props.automation.isTestAutomation)

const triggerModels = computed(
  () =>
    props.automation.currentRevision?.triggerDefinitions
      .map((trigger) => trigger.model)
      .filter(isNonNullable) || []
)

const triggerLabel = computed(() => {
  return isTestAutomation.value ? 'Connected to' : 'Triggered by'
})

const finalModelUrl = (modelId: string) =>
  modelUrl({ projectId: props.projectId, modelId })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center py-2 border-b border-outline-3">
      <CommonTextLink
        :icon-right="ChevronRightIcon"
        size="lg"
        class="!font-bold"
        :to="projectAutomationRoute(projectId, automation.id)"
      >
        {{ automation.name }}
      </CommonTextLink>
    </div>
    <div class="flex gap-1 items-center">
      <Component :is="enabledIcon" class="w-5 h-5" />
      <div class="label-light">{{ enabledText }}</div>
    </div>
    <div class="truncate">
      <CommonTextLink :to="finalModelUrl">{{ automation.model.name }}</CommonTextLink>
    </div>
    <AutomationsRunsTable
      :runs="automation.runs.items"
      :project-id="projectId"
      :model-id="automation.model.id"
      :automation-id="automation.id"
    />
  </div>
</template>
<script setup lang="ts">
import { AutomationsRunsTable } from '#build/components'
import { PlayIcon, PauseIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import { type ProjectPageAutomationsRow_AutomationFragment } from '~/lib/common/generated/gql/graphql'
import { projectAutomationRoute } from '~/lib/common/helpers/route'
import { useViewerRouteBuilder } from '~/lib/projects/composables/models'

graphql(`
  fragment ProjectPageAutomationsRow_Automation on Automation {
    id
    name
    enabled
    model {
      id
      name
    }
    runs(limit: 5) {
      totalCount
      items {
        ...AutomationRunDetails
      }
    }
  }
`)

const props = defineProps<{
  projectId: string
  automation: ProjectPageAutomationsRow_AutomationFragment
}>()

const { modelUrl } = useViewerRouteBuilder()

const modelId = computed(() => props.automation.model.id)
const isEnabled = computed(() => props.automation.enabled)
const enabledIcon = computed(() => (isEnabled.value ? PauseIcon : PlayIcon))
const enabledText = computed(() => (isEnabled.value ? 'Enabled' : 'Paused'))

const finalModelUrl = computed(() =>
  modelUrl({ projectId: props.projectId, modelId: modelId.value })
)
</script>

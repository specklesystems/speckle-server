<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center py-2 border-b border-outline-3">
      <h2 class="h6 font-bold">{{ automation.name }}</h2>
    </div>
    <div class="flex gap-1 items-center">
      <Component :is="enabledIcon" class="w-5 h-5" />
      <div class="label-light">{{ enabledText }}</div>
    </div>
    <div class="truncate">
      <CommonTextLink :to="modelUrl">{{ automation.model.name }}</CommonTextLink>
    </div>
    <LayoutTable
      :columns="[{ id: 'status', header: 'status', classes: '' }]"
      :items="automation.runs.items"
    >
      <template #status="{ item }">
        <CommonBadge v-tippy="item.reason" :color-classes="runStatusClasses(item)">
          {{ item.status.toUpperCase() }}
        </CommonBadge>
      </template>
    </LayoutTable>
  </div>
</template>
<script setup lang="ts">
import { PlayIcon, PauseIcon } from '@heroicons/vue/24/outline'
import { SpeckleViewer } from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql'
import {
  AutomateRunStatus,
  type ProjectPageAutomationsRow_AutomationFragment
} from '~/lib/common/generated/gql/graphql'
import { modelRoute } from '~/lib/common/helpers/route'

type AutomateRun = ProjectPageAutomationsRow_AutomationFragment['runs']['items'][0]

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
        id
        status
        reason
        version {
          id
        }
        createdAt
        updatedAt
      }
    }
  }
`)

const props = defineProps<{
  projectId: string
  automation: ProjectPageAutomationsRow_AutomationFragment
}>()

const isEnabled = computed(() => props.automation.enabled)
const enabledIcon = computed(() => (isEnabled.value ? PauseIcon : PlayIcon))
const enabledText = computed(() => (isEnabled.value ? 'Enabled' : 'Paused'))

const modelUrl = computed(() => {
  const builder = SpeckleViewer.ViewerRoute.resourceBuilder()
  builder.addModel(props.automation.model.id)

  return modelRoute(props.projectId, builder.toString())
})

const runStatusClasses = (run: AutomateRun) => {
  const classParts = ['w-24 justify-center']
  const status = run.status

  switch (status) {
    case AutomateRunStatus.Initializing:
      classParts.push('bg-warning-lighter text-warning-darker')
      break
    case AutomateRunStatus.Running:
      classParts.push('bg-info-lighter text-info-darker')
      break
    case AutomateRunStatus.Failed:
      classParts.push('bg-danger-lighter text-danger-darker')
      break
    case AutomateRunStatus.Succeeded:
      classParts.push('bg-success-lighter text-success-darker')
      break
  }

  return classParts.join(' ')
}
</script>

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
      <CommonTextLink :to="finalModelUrl">{{ automation.model.name }}</CommonTextLink>
    </div>
    <LayoutTable
      :columns="[
        { id: 'status', header: 'status', classes: 'col-span-2' },
        { id: 'runId', header: 'Run ID', classes: 'col-span-3' },
        { id: 'modelVersion', header: 'Model Version', classes: 'col-span-2' },
        { id: 'date', header: 'Date', classes: 'col-span-2' },
        { id: 'duration', header: 'Duration', classes: 'col-span-3' }
      ]"
      :items="automation.runs.items"
      :buttons="[
        {
          icon: EyeIcon,
          label: 'View',
          action: (run) => {
            $emit('view', run, modelId, automation.id)
          },
          textColor: 'primary'
        }
      ]"
    >
      <template #status="{ item }">
        <AutomationsRunsStatusBadge :run="item" />
      </template>
      <template #runId="{ item }">
        <span class="text-foreground label-light">{{ item.id }}</span>
      </template>
      <template #modelVersion="{ item }">
        <CommonTextLink
          :to="
            runModelVersionUrl({
              run: item,
              projectId: projectId,
              modelId: automation.model.id
            })
          "
        >
          {{ item.version.id }}
        </CommonTextLink>
      </template>
      <template #date="{ item }">
        <span class="caption">{{ runDate(item) }}</span>
      </template>
      <template #duration="{ item }">
        <span class="caption">{{ runDuration(item) }}</span>
      </template>
    </LayoutTable>
  </div>
</template>
<script setup lang="ts">
import { PlayIcon, PauseIcon, EyeIcon } from '@heroicons/vue/24/outline'
import { useAutomationRunDetailsFns } from '~/lib/automations/composables/runs'
import { graphql } from '~/lib/common/generated/gql'
import { type ProjectPageAutomationsRow_AutomationFragment } from '~/lib/common/generated/gql/graphql'
import { useViewerRouteBuilder } from '~/lib/projects/composables/models'

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
        ...AutomationRunDetails
      }
    }
  }
`)

defineEmits<{
  view: [AutomateRun, modelId: string, automationId: string]
}>()

const props = defineProps<{
  projectId: string
  automation: ProjectPageAutomationsRow_AutomationFragment
}>()

const { runDate, runDuration, runModelVersionUrl } = useAutomationRunDetailsFns()
const { modelUrl } = useViewerRouteBuilder()

const modelId = computed(() => props.automation.model.id)
const isEnabled = computed(() => props.automation.enabled)
const enabledIcon = computed(() => (isEnabled.value ? PauseIcon : PlayIcon))
const enabledText = computed(() => (isEnabled.value ? 'Enabled' : 'Paused'))

const finalModelUrl = computed(() =>
  modelUrl({ projectId: props.projectId, modelId: modelId.value })
)
</script>

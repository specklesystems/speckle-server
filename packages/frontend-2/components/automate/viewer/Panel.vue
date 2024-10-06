<template>
  <div>
    <ViewerLayoutPanel @close="$emit('close')">
      <template #title>Automate</template>

      <div class="flex items-center space-x-2 w-full pl-3 mt-2">
        <div class="mt-[6px] shrink-0">
          <AutomateRunsTriggerStatusIcon :summary="summary" class="h-6 w-6" />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <h4 :class="[`label font-medium whitespace-normal`, summary.titleColor]">
            {{ summary.title }}
          </h4>
          <div class="caption text-foreground-2 whitespace-normal">
            {{ summary.longSummary }}
          </div>
        </div>
      </div>
      <div class="relative flex flex-col space-y-2 p-2">
        <AutomateViewerPanelFunctionRunRow
          v-for="run in runs"
          :key="run.id"
          :function-run="run"
          :automation-name="run.automationName"
        />
      </div>
    </ViewerLayoutPanel>
    <ViewerLayoutPanel v-if="!!srcdoc" hide-close>
      <FormButton @click="handleParentClick">GO</FormButton>
      <iframe
        ref="iframeRef"
        width="250"
        height="250"
        title="unique-title"
        :srcdoc="srcdoc"
      />
    </ViewerLayoutPanel>
  </div>
</template>
<script setup lang="ts">
import type { Automate } from '@speckle/shared'
import { type RunsStatusSummary } from '~/lib/automate/composables/runStatus'
import { useAutomationsStatusOrderedRuns } from '~/lib/automate/composables/runs'
import { graphql } from '~/lib/common/generated/gql'
import { useFileDownload } from '~/lib/core/composables/fileUpload'
// import { getBlobUrl } from '~/lib/core/api/blobStorage';
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import type { AutomateViewerPanel_AutomateRunFragment } from '~~/lib/common/generated/gql/graphql'

// TODO: Subscriptions

graphql(`
  fragment AutomateViewerPanel_AutomateRun on AutomateRun {
    id
    functionRuns {
      id
      ...AutomateViewerPanelFunctionRunRow_AutomateFunctionRun
    }
    ...AutomationsStatusOrderedRuns_AutomationRun
  }
`)

defineEmits(['close'])

const props = defineProps<{
  automationRuns: AutomateViewerPanel_AutomateRunFragment[]
  summary: RunsStatusSummary
}>()

const { getBlobUrl } = useFileDownload()
const { projectId } = useInjectedViewerState()
const { runs } = useAutomationsStatusOrderedRuns({
  automationRuns: computed(() => props.automationRuns)
})

const iframeRef = ref<HTMLIFrameElement>()
const srcdoc = ref<string>()

watch(
  runs,
  () => {
    const run = runs.value.at(0)
    if (!run) return

    const results = run.results as Automate.AutomateTypes.ResultsSchema
    const blobId = results.values.blobIds?.at(0)
    if (!blobId) return

    getBlobUrl({ blobId, projectId: projectId.value })
      .then((url) => {
        return fetch(url)
      })
      .then((res) => {
        return res.text()
      })
      .then((doc) => {
        srcdoc.value = doc
      })
  },
  {
    immediate: true
  }
)

const handleParentClick = () => {
  iframeRef.value?.contentWindow?.postMessage({ message: 'Hello from speckle' })
}

const handleMessage = (e: MessageEvent) => {
  if (e.data.source !== 'speckle') return
  console.log('INCOMING')
  console.log(e)
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
})
onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

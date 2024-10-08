<template>
  <div class="mt-1 mb-1">
    <ViewerLayoutPanel @close="$emit('close')">
      <div v-if="!showChart && !isAutomationRunning">
        <ViewerDataInsightsEmpty
          :function-id="functionId"
          :function-release-id="functionReleaseId"
          @run-triggered="runTriggered"
        />
      </div>
      <div v-else-if="!showChart && isAutomationRunning">
        Generating visual report
        <!-- <DotLottieVue
          src="https://lottie.host/ffc5ea7d-8c2e-49aa-b84d-9b336ca7b963/ZPSkZUvsE7.json"
          background="transparent"
          speed="1"
          style="width: 300px; height: 300px"
          loop
          autoplay
        /> -->
      </div>
      <div v-else>
        <ViewerDataInsightsGraph :report="report" />
      </div>
    </ViewerLayoutPanel>
  </div>
</template>
<script setup lang="ts">
import type { Report } from '~/components/viewer/data-insights/Graph.vue'
import {
  AutomateRunStatus,
  type AutomateViewerPanel_AutomateRunFragment
} from '~/lib/common/generated/gql/graphql'
// import { useSelectionUtilities } from '~/lib/viewer/composables/ui'
import { useFileDownload } from '~/lib/core/composables/fileUpload'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
const props = defineProps<{
  automationRuns: AutomateViewerPanel_AutomateRunFragment[]
}>()

defineEmits(['close'])

const isEmpty = ref(true)
const isAutomationRunning = ref(false)
// const isEmpty = computed(() => {
//   return !!props.automationRuns.at(0)?.functionRuns.at(0)?.function?.id
// })

const functionReleaseId = '379c034163'
const functionId = '4b7c33d5cf'

const expectedRunId = ref<string | undefined>()
// const expectedRunId = ref<string | undefined>('59c66de9bf0d269')

const runTriggered = (runId: string) => {
  isEmpty.value = false
  isAutomationRunning.value = true
  expectedRunId.value = runId
}

const showChart = computed(() => {
  const maybeMatchingRun = props.automationRuns.find(
    (r) => r.id === expectedRunId.value
  )
  if (maybeMatchingRun) {
    return maybeMatchingRun.functionRuns[0].status === AutomateRunStatus.Succeeded
  } else {
    return false
  }
})

// const { objects } = useSelectionUtilities()
const { getBlobUrl } = useFileDownload()
const { projectId } = useInjectedViewerState()

type MaterialData = [
  ('id' | 'Type' | 'Material' | 'Grade' | 'Volume' | 'Mass')[],
  ...(string | number)[][]
]

type MaterialDataEntry = {
  id: string
  Type: string
  Material: string
  Grade: string
  Volume: string
  Mass: string
}

const report = ref<Report>({
  name: 'Material Composition',
  entries: []
})

watch(
  props,
  () => {
    const run = props.automationRuns.find((run) => run.id === expectedRunId.value)

    console.log(run)
    if (!run) return

    console.log(run)
    const results = run.functionRuns[0].results as Automate.AutomateTypes.ResultsSchema
    const blobId = results.values.blobIds?.[0]

    getBlobUrl({ blobId: blobId!, projectId: projectId.value })
      .then((url) => {
        return fetch(url)
      })
      .then((res) => {
        return res.text()
      })
      .then((data) => {
        console.log(data)
        const reportData = toReport(JSON.parse(data))
        console.log(reportData)
        report.value = reportData
      })
  },
  {
    immediate: true
  }
)

const toReport = (data: MaterialData): Report => {
  let totalVolume = 0
  const volumeByMaterial: Record<string, number> = {}
  const volumeByMaterialGrade: Record<string, Record<string, number>> = {}

  const objectIdsByMaterialByGrade: Record<string, Record<string, string[]>> = {}

  const [headers, ...entries] = data

  for (const flatEntry of entries) {
    const entry: Partial<MaterialDataEntry> = {}

    for (let i = 0; i < flatEntry.length; i++) {
      entry[headers[i] as unknown as keyof MaterialDataEntry] = flatEntry[i].toString()
    }

    if (!entry.id || !entry.Volume || !entry.Material || !entry.Grade) {
      continue
    }

    const entryVolume = Number.parseFloat(entry.Volume)

    const factor = 1

    totalVolume = totalVolume + entryVolume * factor

    volumeByMaterial[entry.Material] ??= 0
    volumeByMaterial[entry.Material] =
      volumeByMaterial[entry.Material] + entryVolume * factor

    volumeByMaterialGrade[entry.Material] ??= {}
    volumeByMaterialGrade[entry.Material][entry.Grade] ??= 0
    volumeByMaterialGrade[entry.Material][entry.Grade] =
      volumeByMaterialGrade[entry.Material][entry.Grade] + entryVolume * factor

    objectIdsByMaterialByGrade[entry.Material] ??= {}
    objectIdsByMaterialByGrade[entry.Material][entry.Grade] ??= []
    objectIdsByMaterialByGrade[entry.Material][entry.Grade].push(entry.id)
  }

  const report: Report = {
    name: 'Material Composition',
    entries: Object.entries(volumeByMaterial).map(
      ([material, materialTotalVolume]) => ({
        label: material,
        totalPercent: (materialTotalVolume / totalVolume) * 100,
        segments: Object.entries(volumeByMaterialGrade[material]).map(
          ([grade, gradeTotalVolume]) => ({
            objectIds: objectIdsByMaterialByGrade[material][grade],
            entryPercent: (gradeTotalVolume / materialTotalVolume) * 100
          })
        )
      })
    )
  }

  return report
}
</script>

<template>
  <div class="mt-1 mb-1">
    <ViewerLayoutPanel @close="$emit('close')">
      <div v-if="isEmpty">
        <ViewerDataInsightsEmpty />
      </div>
      <div v-else>
        <ViewerDataInsightsGraph :report="report" />
      </div>
    </ViewerLayoutPanel>
  </div>
</template>

<script setup lang="ts">
import type { Automate } from '@speckle/shared'
import type { Report } from '~/components/viewer/data-insights/Graph.vue'
import type { AutomateViewerPanel_AutomateRunFragment } from '~/lib/common/generated/gql/graphql'
import { useFileDownload } from '~/lib/core/composables/fileUpload'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

const props = defineProps<{
  automationRuns: AutomateViewerPanel_AutomateRunFragment[]
}>()

defineEmits(['close'])

const isEmpty = false

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
  entries: [
    {
      label: 'Steel',
      totalPercent: 60,
      segments: [
        {
          objectIds: ['db93d618dc57f1bafb38191e75864574'],
          entryPercent: 60
        },
        {
          objectIds: ['db93d618dc57f1bafb38191e75864574'],
          entryPercent: 30
        },
        {
          objectIds: ['db93d618dc57f1bafb38191e75864574'],
          entryPercent: 10
        }
      ]
    },
    {
      label: 'Timber',
      totalPercent: 30,
      segments: [
        {
          objectIds: ['db93d618dc57f1bafb38191e75864574'],
          entryPercent: 60
        },
        {
          objectIds: ['db93d618dc57f1bafb38191e75864574'],
          entryPercent: 30
        },
        {
          objectIds: ['db93d618dc57f1bafb38191e75864574'],
          entryPercent: 10
        }
      ]
    },
    {
      label: 'Grass',
      totalPercent: 10,
      segments: [
        {
          objectIds: ['db93d618dc57f1bafb38191e75864574'],
          entryPercent: 60
        },
        {
          objectIds: ['db93d618dc57f1bafb38191e75864574'],
          entryPercent: 30
        },
        {
          objectIds: ['db93d618dc57f1bafb38191e75864574'],
          entryPercent: 10
        }
      ]
    }
  ]
})

watch(
  props,
  () => {
    // const run = props.automationRuns.at(0)

    // if (!run) return

    // const results = run.functionRuns[0].results as Automate.AutomateTypes.ResultsSchema
    // const blobId = results.values.blobIds?.[0]

    const blobId = 'e5a5b23698'

    getBlobUrl({ blobId: blobId!, projectId: projectId.value })
      .then((url) => {
        console.log(url)
        return fetch(url)
      })
      .then((res) => {
        return res.text()
      })
      .then((data) => {
        const json = JSON.parse(data.replaceAll("'", '"').replaceAll('None', '""'))
        report.value = toReport(json)
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

    const factor = entry.Material === 'Concrete' ? 0.1 : 1

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

  // console.log(volumeByMaterialGrade)

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

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
import type { Report } from '~/components/viewer/data-insights/Graph.vue'
import type { AutomateViewerPanel_AutomateRunFragment } from '~/lib/common/generated/gql/graphql'
import { useSelectionUtilities } from '~/lib/viewer/composables/ui'

defineProps<{
  automationRuns: AutomateViewerPanel_AutomateRunFragment[]
}>()

defineEmits(['close'])

const isEmpty = false

const { objects } = useSelectionUtilities()

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

    totalVolume = totalVolume + entryVolume

    volumeByMaterial[entry.Material] ??= 0
    volumeByMaterial[entry.Material] = volumeByMaterial[entry.Material] + entryVolume

    volumeByMaterialGrade[entry.Material] ??= {}
    volumeByMaterialGrade[entry.Material][entry.Grade] ??= 0
    volumeByMaterialGrade[entry.Material][entry.Grade] =
      volumeByMaterialGrade[entry.Material][entry.Grade] + entryVolume

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

const report: Report = {
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
      label: 'Label',
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
      label: 'Label',
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
}
</script>

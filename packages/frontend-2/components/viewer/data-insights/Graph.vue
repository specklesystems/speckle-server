<template>
  <div class="w-full grid grid-cols-[min-content_1fr] grid-flow-row gap-2">
    <div class="col-span-2 row-span-1">Graph Name</div>
    <template v-for="(entry, i) in report.entries" :key="i">
      <div class="pl-2 pr-4 h-6 flex items-center">
        <p class="text-sm">{{ entry.label }}</p>
      </div>
      <div>
        <div class="w-full h-full bg-foundation-2 rounded-md p-[2px]">
          <div class="w-full h-full flex flex-row">
            <div
              class="h-full border border-2 border-white rounded-md overflow-hidden flex flex-row"
              :style="{ width: `${max([entry.totalPercent, 5])}%` }"
            >
              <div
                v-for="(segment, j) in entry.segments"
                :key="j"
                class="h-full hover:opacity-80"
                :style="{
                  width: `${segment.entryPercent}%`,
                  backgroundColor: colors[i][j]
                }"
                @click="() => handleClick(segment.objectIds)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div class="col-start-2 col-span-1 row-span-1">
      <div class="w-full h-full flex justify-between">
        <p class="text-sm">0</p>
        <p class="text-sm">100%</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { max } from 'lodash-es'
import { useSelectionUtilities } from '~/lib/viewer/composables/ui'

defineProps<{
  report: Report
}>()

const { setSelectionFromObjectIds } = useSelectionUtilities()

const handleClick = (objectIds: string[]): void => {
  setSelectionFromObjectIds(objectIds)
}

export type Report = {
  name: string
  entries: {
    label: string
    totalPercent: number
    segments: {
      objectIds: string[]
      entryPercent: number
    }[]
  }[]
}

const colors = [
  // Steel is blue
  ['#2227C2', '#4E54F9', '#777BFA', '#A2A5FC'],
  ['#2227C2', '#4E54F9', '#777BFA', '#A2A5FC'],
  ['#2227C2', '#4E54F9', '#777BFA', '#A2A5FC'],
  ['#2227C2', '#4E54F9', '#777BFA', '#A2A5FC']
]
</script>

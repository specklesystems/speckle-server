<template>
  <div class="space-y-2 p-2 text-primary bg-blue-500/10 rounded-md text-xs">
    <div v-if="selectionStore.selectionInfo.selectedObjectIds?.length === 0">
      No views selected from Project Browser in Revit, go ahead and select some!
    </div>
    <div v-else>{{ selectionStore.selectionInfo.summary }}</div>
  </div>
</template>

<script setup lang="ts">
import type { ISendFilter, RevitSelectionSendFilter } from '~/lib/models/card/send'
import { storeToRefs } from 'pinia'
import { useSelectionStore } from '~~/store/selection'

const emit = defineEmits<{
  (e: 'update:filter', filter: ISendFilter): void
}>()

const props = defineProps<{
  filter: RevitSelectionSendFilter
}>()

console.log(props.filter)

const selectionStore = useSelectionStore()
const { selectionInfo } = storeToRefs(selectionStore)

watch(
  selectionInfo,
  (newValue) => {
    const filter = { ...props.filter } as RevitSelectionSendFilter
    filter.selectedViewIds = newValue.selectedObjectIds
    filter.summary = newValue.summary as string
    emit('update:filter', filter)
  },
  { deep: true, immediate: true }
)
</script>

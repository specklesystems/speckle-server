<template>
  <div class="space-y-2 p-2 text-primary bg-blue-500/10 rounded-md text-xs">
    <div v-if="selectionStore.selectionInfo.selectedObjectIds?.length === 0">
      No objects selected, go ahead and select some!
    </div>
    <div v-else>{{ selectionStore.selectionInfo.summary }}</div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { IDirectSelectionSendFilter, ISendFilter } from '~/lib/models/card/send'
import { useHostAppStore } from '~~/store/hostApp'
import { useSelectionStore } from '~~/store/selection'

const emit = defineEmits<{
  (e: 'update:filter', filter: ISendFilter): void
}>()

const store = useHostAppStore()
const { selectionFilter } = storeToRefs(store)

const selectionStore = useSelectionStore()
const { selectionInfo } = storeToRefs(selectionStore)

defineProps<{
  filter: IDirectSelectionSendFilter
}>()

watch(
  selectionInfo,
  (newValue) => {
    const filter = { ...selectionFilter.value } as IDirectSelectionSendFilter
    filter.selectedObjectIds = newValue.selectedObjectIds
    filter.summary = newValue.summary as string
    emit('update:filter', filter)
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  selectionStore.refreshSelectionFromHostApp()
})
</script>

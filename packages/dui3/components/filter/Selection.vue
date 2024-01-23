<template>
  <div class="space-y-2 p-2 text-primary bg-blue-500/10 rounded-md">
    <div v-if="selectionStore.selectionInfo.selectedObjectIds?.length === 0">
      No objects selected, go ahead and select some!
    </div>
    <div v-else>{{ selectionStore.selectionInfo.summary }}.</div>
  </div>
</template>
<script setup lang="ts">
import { IDirectSelectionSendFilter } from 'lib/models/card/send'
import { useHostAppStore } from '~~/store/hostApp'
import { useSelectionStore } from '~~/store/selection'

const emit = defineEmits<{
  (e: 'save', filter: IDirectSelectionSendFilter): void
  (e: 'save-and-send', filter: IDirectSelectionSendFilter): void
}>()

const store = useHostAppStore()
const { selectionFilter } = storeToRefs(store)

const selectionStore = useSelectionStore()

defineProps<{
  filter: IDirectSelectionSendFilter
}>()

const save = (andSend = false) => {
  const filter = { ...selectionFilter.value } as IDirectSelectionSendFilter
  filter.selectedObjectIds = selectionStore.selectionInfo.selectedObjectIds
  filter.summary = selectionStore.selectionInfo.summary as string

  if (andSend) return emit('save-and-send', filter)
  emit('save', filter)
}
</script>

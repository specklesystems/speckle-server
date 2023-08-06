<template>
  <div class="space-y-2 px-2">
    <div class="text-xs"></div>
    <div
      v-if="
        !selectionStore.selectionInfo.selectedObjectIds ||
        selectionStore.selectionInfo.selectedObjectIds?.length === 0
      "
    >
      Currently sending {{ filter.selectedObjectIds?.length }} objects. Select some
      objects to change what you send to this model.
    </div>
    <div v-else class="space-y-2">
      <div>
        Current selection:
        {{ selectionStore.selectionInfo.summary }}
      </div>
      <div class="flex w-full justify-end">
        <FormButton text @click="save()">Save</FormButton>
        <FormButton @click="save(true)">Save & Send</FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { IDirectSelectionSendFilter } from '~~/lib/bindings/definitions/ISendBinding'
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

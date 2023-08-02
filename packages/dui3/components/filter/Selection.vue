<template>
  <div class="space-y-2 px-2">
    <div class="text-xs"></div>
    <div
      v-if="
        !selectionStore.selectionInfo.selectedObjectIds ||
        selectionStore.selectionInfo.selectedObjectIds?.length === 0
      "
    >
      Currently sending {{ filter.selectedObjectIds.length }} objects. Select some
      objects to change what you send to this model.
    </div>
    <div v-else class="space-y-2">
      <div>
        Current selection:
        {{ selectionStore.selectionInfo.summary }}
      </div>
      <div class="flex w-full justify-end">
        <FormButton text>
          Save
          <!-- ({{
          selectionStore.selectionInfo.selectedObjectIds.length
        }}
        objects). -->
        </FormButton>
        <FormButton>
          Save & Send
          <!-- current selection ({{
          selectionStore.selectionInfo.selectedObjectIds.length
        }}
        objects). -->
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { IDirectSelectionSendFilter } from '~~/lib/bindings/definitions/IBasicConnectorBinding'
import { useSendFilterStore } from '~~/store/sendFilter'
import { useSelectionStore } from '~~/store/selection'

const sendFilterStore = useSendFilterStore()
const { sendFilters } = storeToRefs(sendFilterStore)

const selectionStore = useSelectionStore()

const props = defineProps<{
  filter: IDirectSelectionSendFilter
}>()
</script>

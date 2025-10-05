<template>
  <div>
    <FormSelectBase
      v-model="selectedHub"
      name="accHubs"
      label="Hubs"
      show-label
      :items="hubs"
      size="base"
      color="foundation"
      placeholder="Select hub"
      @update:model-value="handleHubChange"
    >
      <template #something-selected="{ value }">
        {{ isArray(value) ? value[0].attributes.name : value.attributes.name }}
      </template>
      <template #option="{ item }">
        {{ item.attributes.name }}
      </template>
    </FormSelectBase>

    <div v-if="!loading && hubs.length == 0" class="text-xs italic">No hubs found.</div>
  </div>
</template>

<script setup lang="ts">
import { isArray } from 'lodash-es'
import type { AccHub } from '@speckle/shared/acc'

const props = defineProps<{
  hubs: AccHub[]
  loading: boolean
}>()

const emits = defineEmits<{
  (e: 'hub-selected', hub: AccHub): void
}>()

const handleHubChange = (newHub: AccHub | AccHub[] | undefined) => {
  // is array not likely but make TS happy
  if (!newHub || isArray(newHub)) {
    return
  }
  emits('hub-selected', newHub)
}

const selectedHub = ref<AccHub>()

watch(
  () => props.hubs,
  (newHubs) => {
    if (newHubs.length > 0) {
      selectedHub.value = newHubs[0]
      emits('hub-selected', newHubs[0])
    }
  },
  { immediate: true }
)
</script>

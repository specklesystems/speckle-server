<template>
  <div class="space-y-2">
    <div>
      <FormSelectBase
        v-model="filter"
        name="sendFilter"
        label="Avaialble send filters"
        class="w-full"
        fixed-height
        :items="sendFilters"
        :allow-unset="false"
      >
        <template #something-selected="{ value }">
          <span class="text-primary text-base">{{ (value as ISendFilter).name }}</span>
        </template>
        <template #option="{ item }">
          <span class="text-base">{{ item.name }}</span>
        </template>
      </FormSelectBase>
    </div>
    <div v-if="filter">
      <!-- Everything -->
      <div v-if="filter.name === 'Everything'">
        <div class="p-4 text-primary bg-blue-500/10 rounded-md">
          All supported objects will be sent. Depending on the model, this might take a
          while.
        </div>
      </div>
      <div v-else-if="filter.name === 'Selection'">
        <FilterSelection :filter="(filter as IDirectSelectionSendFilter)" />
      </div>

      <!-- Other filters -->
      <!-- NOTE: unsure yet how this will play out -->
      <!-- Theoretically, filters are just... forms. So we could treat them as such? -->
      <div v-else-if="filter.name === 'Layers'">TODO</div>
    </div>
    <div>
      {{ filter }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { ISendFilter, IDirectSelectionSendFilter } from 'lib/models/card/send'
import { useHostAppStore } from '~~/store/hostApp'

const store = useHostAppStore()
const { sendFilters, selectionFilter } = storeToRefs(store)

const filter = defineModel<ISendFilter>('filter', {
  default: { ...selectionFilter.value }
})
</script>

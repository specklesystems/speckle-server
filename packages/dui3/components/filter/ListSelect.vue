<template>
  <div class="space-y-2">
    <div>
      <FormSelectBase
        v-model="selectedFilterName"
        name="sendFilter"
        label="Avaialble send filters"
        class="w-full"
        fixed-height
        :items="filterNames"
        :allow-unset="false"
        mount-menu-on-body
      >
        <template #something-selected="{ value }">
          <span class="text-primary text-base">{{ value }}</span>
        </template>
        <template #option="{ item }">
          <span class="text-base">{{ item }}</span>
        </template>
      </FormSelectBase>
    </div>
    <div v-if="selectedFilter">
      <div v-if="selectedFilter.name === 'Everything'">
        <div class="p-4 text-primary bg-blue-500/10 rounded-md text-xs">
          All supported objects will be sent. Depending on the model, this might take a
          while.
        </div>
      </div>
      <div v-else-if="selectedFilter.name === 'Selection'">
        <FilterSelection
          :filter="(selectedFilter as IDirectSelectionSendFilter)"
          @update:filter="(filter) => (selectedFilter = filter)"
        />
      </div>
      <div v-else-if="selectedFilter.name === 'Layers'">TODO</div>
    </div>
    <div v-if="!!filter" class="text-xs caption rounded p-2 bg-orange-500/10">
      This action will replace the existing
      <b>{{ filter.name }}</b>
      filter.
    </div>
  </div>
</template>
<script setup lang="ts">
import { ISendFilter, IDirectSelectionSendFilter } from 'lib/models/card/send'
import { useHostAppStore } from '~~/store/hostApp'

const store = useHostAppStore()
const { sendFilters, selectionFilter } = storeToRefs(store)

const props = defineProps<{
  filter?: ISendFilter
}>()

const emit = defineEmits<{ (e: 'update:filter', value: ISendFilter): void }>()
const selectedFilter = ref<ISendFilter>(props.filter || selectionFilter.value)

const selectedFilterName = ref(selectionFilter.value.name)
const filterNames = computed(() => sendFilters.value?.map((f) => f.name))

watch(selectedFilterName, (newValue) => {
  selectedFilter.value = sendFilters.value?.find(
    (f) => f.name === newValue
  ) as ISendFilter
})

watch(selectedFilter, (newValue) => {
  emit('update:filter', newValue)
})
</script>

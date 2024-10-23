<template>
  <div class="mt-4 space-y-2">
    <FormSelectBase
      key="name"
      v-model="selectedView"
      :search="true"
      :search-placeholder="''"
      :filter-predicate="searchFilterPredicate"
      name="view"
      label="View"
      placeholder="Nothing selected"
      class="w-full"
      fixed-height
      show-label
      :items="filter.availableViews"
      :allow-unset="false"
      mount-menu-on-body
    >
      <template #something-selected="{ value }">
        <span class="text-primary text-base text-sm">{{ value }}</span>
      </template>
      <template #option="{ item }">
        <span class="text-base text-sm">{{ item }}</span>
      </template>
    </FormSelectBase>
  </div>
</template>

<script setup lang="ts">
import type { ISendFilter, RevitViewsSendFilter } from '~/lib/models/card/send'

const emit = defineEmits<{
  (e: 'update:filter', filter: ISendFilter): void
}>()

const props = defineProps<{
  filter: RevitViewsSendFilter
}>()

const selectedView = ref<string>(props.filter.selectedView)

const searchFilterPredicate = (item: string, search: string) =>
  item.toLocaleLowerCase().includes(search.toLocaleLowerCase())

watch(
  selectedView,
  (newValue) => {
    const filter = { ...props.filter } as RevitViewsSendFilter
    filter.selectedView = newValue as string
    filter.summary = newValue
    emit('update:filter', filter)
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="mt-4 space-y-2">
    <FormSelectBase
      key="name"
      v-model="selectedCategories"
      :search="true"
      :search-placeholder="''"
      :filter-predicate="searchFilterPredicate"
      name="category"
      label="Category"
      placeholder="Nothing selected"
      class="w-full"
      fixed-height
      show-label
      :items="filter.availableCategories.map((c) => c.name)"
      :allow-unset="false"
      multiple
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
import type { ISendFilter, RevitCategoriesSendFilter } from '~/lib/models/card/send'

const emit = defineEmits<{
  (e: 'update:filter', filter: ISendFilter): void
}>()

const props = defineProps<{
  filter: RevitCategoriesSendFilter
}>()

const selectedCategories = ref<string[]>([])

const searchFilterPredicate = (item: string, search: string) =>
  item.toLocaleLowerCase().includes(search.toLocaleLowerCase())

watch(
  selectedCategories,
  (newValue) => {
    const filter = { ...props.filter } as RevitCategoriesSendFilter
    filter.selectedCategories = filter.availableCategories
      .filter((c) => newValue.includes(c.name))
      .map((c) => c.id)
    filter.summary = newValue.join(', ') // TODO: better
    emit('update:filter', filter)
  },
  { deep: true, immediate: true }
)
</script>

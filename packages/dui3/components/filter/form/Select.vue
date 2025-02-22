<template>
  <FormSelectBase
    key="id"
    v-model="selectedItems"
    :items="items"
    :search="true"
    :search-placeholder="''"
    :filter-predicate="searchFilterPredicate"
    :label="label"
    :name="label"
    placeholder="Nothing selected"
    class="w-full"
    fixed-height
    show-label
    :allow-unset="false"
    mount-menu-on-body
    :multiple="filter.isMultiSelectable"
  >
    <template #option="{ item }">
      <span class="text-base text-sm">{{ item.name }}</span>
    </template>
    <template #something-selected="{ value }">
      <span class="text-primary text-base text-sm">
        {{
          filter.isMultiSelectable
            ? (value as ISendFilterSelectItem[]).map((v) => v.name).join(', ')
            : (value as ISendFilterSelectItem).name
        }}
      </span>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import type {
  ISendFilter,
  SendFilterSelect,
  ISendFilterSelectItem
} from '~/lib/models/card/send'

const emit = defineEmits<{
  (e: 'update:filter', filter: ISendFilter): void
}>()

const props = defineProps<{
  label: string
  filter: SendFilterSelect
  items: ISendFilterSelectItem[]
}>()

const selectedItems = ref<ISendFilterSelectItem[]>(props.filter.selectedItems)

const searchFilterPredicate = (item: ISendFilterSelectItem, search: string) =>
  item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())

watch(
  selectedItems,
  (newValue) => {
    // At first it trigger undefined change
    if (!newValue) {
      return
    }
    // unless isMultiSelectable, newValue arrives as ISendFilterSelectItem
    if (!Array.isArray(newValue)) {
      const filter = { ...props.filter } as SendFilterSelect
      filter.selectedItems = [newValue]
      filter.summary = (newValue as ISendFilterSelectItem).name
      emit('update:filter', filter)
      return
    }

    // if isMultiSelectable, newValue arrives as ISendFilterSelectItem[]
    const filter = { ...props.filter } as SendFilterSelect
    filter.selectedItems = newValue as ISendFilterSelectItem[]
    filter.summary = props.filter.isMultiSelectable
      ? newValue.map((v) => v.name).join(', ')
      : newValue[0].name

    emit('update:filter', filter)
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="mt-4 space-y-2">
    <div class="flex items-center space-x-2 justify-between">
      <FormTextInput
        v-model="searchValue"
        placeholder="Search"
        name="search"
        autocomplete="off"
        :show-clear="!!searchValue"
        full-width
        color="foundation"
      />
    </div>
    <div>
      <ul>
        <li v-for="i in finalItems" :key="i.id">
          <FormCheckbox
            :name="i.name"
            :model-value="selectedValues.includes(i.id)"
            @update:model-value="(newValue) => handleCheckBoxChange(i.id, !!newValue)"
          ></FormCheckbox>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  CategoriesData,
  ISendFilter,
  RevitCategoriesSendFilter
} from '~/lib/models/card/send'

const searchValue = ref<string>()
const selectedValues = ref<string[]>([])

const emit = defineEmits<{
  (e: 'update:filter', filter: ISendFilter): void
}>()

const props = defineProps<{
  filter: RevitCategoriesSendFilter
}>()

const availableCategories = ref<CategoriesData[]>(props.filter.availableCategories)
const sortedCategories = computed(() => {
  return [...availableCategories.value].sort((a, b) => {
    const aSelected = selectedValues.value.includes(a.id) ? -1 : 1
    const bSelected = selectedValues.value.includes(b.id) ? -1 : 1
    return aSelected - bSelected || a.name.localeCompare(b.name)
  })
})

const selectedCategories = ref<string[]>([])

watch(
  selectedCategories,
  (newValue) => {
    const filter = { ...props.filter } as RevitCategoriesSendFilter
    filter.selectedCategories = availableCategories.value
      .filter((c) => newValue.includes(c.name))
      .map((c) => c.id)
    filter.summary = newValue.join(', ') // TODO: better
    emit('update:filter', filter)
  },
  { deep: true, immediate: true }
)

const searchFilterPredicate = (item: string, search: string) =>
  item.toLocaleLowerCase().includes(search.toLocaleLowerCase())

const finalItems = computed(() => {
  const searchVal = searchValue.value
  if (!searchVal?.length) return sortedCategories.value

  return sortedCategories.value.filter(
    (i) =>
      searchFilterPredicate?.(i.name, searchVal) ||
      selectedCategories.value.includes(i.id)
  )
})

const handleCheckBoxChange = (id: string, newValue: boolean) => {
  console.log(newValue, id)

  if (newValue) {
    selectedValues.value.push(id)
  } else {
    const index = selectedValues.value.indexOf(id)
    if (index > -1) {
      selectedValues.value.splice(index, 1)
    }
  }
}
</script>

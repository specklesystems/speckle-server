<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
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
    <div class="flex space-y-1 flex-col">
      <div
        v-for="cat in selectedCategoriesObjects.sort((a, b) =>
          a.name.localeCompare(b.name)
        )"
        :key="cat.id"
      >
        <div
          v-tippy="'Remove'"
          :class="`block h-6 text-body-2xs px-2 py-1 rounded-md flex align-center justify-between w-full hover:cursor-pointer hover:shadow-md bg-primary text-foreground-on-primary border-outline-2 text-foreground font-medium p-1 border focus-visible:border-foundation`"
          @click="selectOrUnselectCategory(cat.id)"
        >
          <span>{{ cat.name }}</span>
          <XMarkIcon class="w-4" />
        </div>
      </div>
    </div>
    <div
      class="flex space-y-1 flex-col simple-scrollbar overflow-y-auto min-h-0 max-h-48 overflow-x-hidden"
    >
      <div
        v-for="cat in searchResults.sort((a, b) => a.name.localeCompare(b.name))"
        :key="cat.id"
        v-tippy="'Add'"
        :class="`block h-6 text-body-2xs ${
          selectedCategories.includes(cat.id) ? 'bg-primary' : ''
        } px-2 py-1 rounded-md align-center justify-between w-full hover:cursor-pointer hover:shadow-md bg-foundation border-outline-2 text-foreground font-medium p-1 hover:bg-primary-muted border disabled:hover:bg-foundation focus-visible:border-foundation`"
        @click="selectOrUnselectCategory(cat.id)"
      >
        <span>{{ cat.name }}</span>
        <!-- <PlusIcon class="w-4" /> -->
      </div>
      <div v-if="searchResults.length === 0" class="text-xs text-center">
        Nothing found
        <FormButton color="outline" size="sm" @click="searchValue = undefined">
          Clear search
        </FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid'
import type {
  CategoriesData,
  ISendFilter,
  RevitCategoriesSendFilter
} from '~/lib/models/card/send'

const searchValue = ref<string>()

const emit = defineEmits<{
  (e: 'update:filter', filter: ISendFilter): void
}>()

const props = defineProps<{
  filter: RevitCategoriesSendFilter
}>()

const availableCategories = ref<CategoriesData[]>(props.filter.availableCategories)

const searchResults = computed(() => {
  const searchVal = searchValue.value
  if (!searchVal?.length)
    return availableCategories.value.filter(
      (cat) => !selectedCategories.value.includes(cat.id)
    )

  return availableCategories.value.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchVal.toLowerCase()) &&
      !selectedCategories.value.includes(cat.id)
  )
})

const selectedCategories = ref<string[]>(props.filter.selectedCategories || [])

const selectOrUnselectCategory = (id: string) => {
  const index = selectedCategories.value.indexOf(id)
  if (index !== -1) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(id)
  }
}

const selectedCategoriesObjects = computed(() => {
  return selectedCategories.value.map((id) =>
    availableCategories.value.find((cat) => cat.id === id)
  ) as CategoriesData[]
})

watch(
  selectedCategoriesObjects,
  (newValue) => {
    const filter = { ...props.filter } as RevitCategoriesSendFilter
    const names = newValue.map((v) => v.name)
    filter.selectedCategories = availableCategories.value
      .filter((c) => names.includes(c.name))
      .map((c) => c.id)
    filter.summary = names.join(', ')
    emit('update:filter', filter)
  },
  { deep: true, immediate: true }
)
</script>

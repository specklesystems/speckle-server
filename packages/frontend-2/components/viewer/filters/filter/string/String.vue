<template>
  <div
    class="pt-0.5"
    :class="{
      'pb-1.5': [
        ExistenceFilterCondition.IsSet,
        ExistenceFilterCondition.IsNotSet
      ].includes(filter.condition as ExistenceFilterCondition)
    }"
  >
    <ViewerFiltersFilterConditionSelector
      :filter="filter"
      @select-condition="handleConditionSelect"
    />

    <template
      v-if="
        ![ExistenceFilterCondition.IsSet, ExistenceFilterCondition.IsNotSet].includes(
          filter.condition as ExistenceFilterCondition
        )
      "
    >
      <div class="relative">
        <ViewerSearchInput
          v-if="!collapsed && filter.condition"
          v-model="searchQuery"
          placeholder="Search values..."
          class="pl-1 -mt-0.5 border-b border-outline-3"
        />
        <div
          v-if="hasSearchValue"
          class="absolute top-0 right-0 w-8 flex justify-center items-center h-full"
        >
          <FormButton
            size="sm"
            color="subtle"
            tabindex="-1"
            hide-text
            :icon-left="X"
            @click="clearSearch"
          >
            Clear
          </FormButton>
        </div>
      </div>

      <ViewerFiltersFilterStringCheckboxes
        :filter="filter"
        :search-query="searchQuery"
        :sort-mode="sortMode"
        class="my-1"
        @update:sort-mode="emit('update:sortMode', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  StringFilterData,
  ConditionOption,
  SortMode
} from '~/lib/viewer/helpers/filters/types'
import { ExistenceFilterCondition } from '~/lib/viewer/helpers/filters/types'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  filter: StringFilterData
  sortMode: SortMode
}>()

const emit = defineEmits<(e: 'update:sortMode', v: SortMode) => void>()

const { updateFilterCondition } = useFilterUtilities()

const collapsed = ref(false)
const searchQuery = ref('')

const hasSearchValue = computed(() => searchQuery.value.trim().length > 0)

const handleConditionSelect = (conditionOption: ConditionOption) => {
  updateFilterCondition(props.filter.id, conditionOption.value)
}

const clearSearch = () => {
  searchQuery.value = ''
}
</script>

<template>
  <div
    class="pt-0.5"
    :class="{ 'pb-1.5': filter.condition === StringFilterCondition.IsSet }"
  >
    <ViewerFiltersFilterConditionSelector
      :filter="filter"
      class="pl-9"
      @select-condition="handleConditionSelect"
    />

    <template v-if="filter.condition !== StringFilterCondition.IsSet">
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
        class="my-1"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { FilterData, ConditionOption } from '~/lib/viewer/helpers/filters/types'
import { StringFilterCondition } from '~/lib/viewer/helpers/filters/types'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  filter: FilterData
}>()

const collapsed = ref(false)
const searchQuery = ref('')

const { updateFilterCondition } = useFilterUtilities()

const handleConditionSelect = (conditionOption: ConditionOption) => {
  updateFilterCondition(props.filter.id, conditionOption.value)
}

const hasSearchValue = computed(() => searchQuery.value.trim().length > 0)

const clearSearch = () => {
  searchQuery.value = ''
}
</script>

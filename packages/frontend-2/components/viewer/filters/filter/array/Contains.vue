<template>
  <div :class="noPadding ? '' : 'px-4'">
    <div class="flex flex-col gap-2 pb-1 pt-1.5 px-5">
      <FormTextInput
        v-model="searchValue"
        name="arraySearchValue"
        placeholder="Enter value to search for..."
        size="sm"
        :disabled="!filter.isApplied"
        auto-focus
        class="text-foreground !text-[12px] w-full bg-transparent !px-2 !border !border-outline-2 focus:outline-none hover:ring-1 hover:ring-outline-2 focus:ring-1 focus:ring-outline-4 rounded no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        @input="handleSearchValueChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArrayFilterData } from '~/lib/viewer/helpers/filters/types'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { FormTextInput } from '@speckle/ui-components'

const props = defineProps<{
  filter: ArrayFilterData
  noPadding?: boolean
}>()

const { updateArrayFilterSearchValue } = useFilterUtilities()

const searchValue = ref(props.filter.searchValue || '')

const handleSearchValueChange = () => {
  updateArrayFilterSearchValue(props.filter.id, searchValue.value)
}
</script>

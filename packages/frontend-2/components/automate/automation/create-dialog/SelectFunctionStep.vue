<template>
  <div>
    <FormTextInput
      name="search"
      placeholder="Search Functions"
      show-clear
      :model-value="bind.modelValue.value"
      full-width
      v-on="on"
    />
    <div class="mt-2">
      <CommonLoadingBar :loading="loading" />
      <AutomateFunctionCardView small-view>
        <AutomateFunctionCard
          v-for="fn in items"
          :key="fn.id"
          :fn="fn"
          external-more-info
          :selected="selectedFunctionId === fn.id"
          @use="() => (selectedFunctionId = fn.id)"
        />
      </AutomateFunctionCardView>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useDebouncedTextInput } from '@speckle/ui-components'
import { useQueryLoading, useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'

// TODO: Pagination

const searchQuery = graphql(`
  query AutomationCreateDialogFunctionsSearch($search: String) {
    automateFunctions(limit: 21, filter: { search: $search }) {
      items {
        id
        ...AutomationsFunctionsCard_AutomateFunction
      }
    }
  }
`)

const selectedFunctionId = defineModel<string | undefined>('selectedFunctionId', {
  required: true
})
const { on, bind, value: search } = useDebouncedTextInput()
const loading = useQueryLoading()
const { result } = useQuery(searchQuery, () => ({
  search: search.value?.length ? search.value : null
}))

const items = computed(() => result.value?.automateFunctions.items || [])
</script>

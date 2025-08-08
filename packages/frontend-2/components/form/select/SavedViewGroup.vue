<template>
  <FormSelectBase
    v-model="selectedValue"
    :name="name || 'savedViewGroup'"
    :label="label || 'Group'"
    :label-id="labelId"
    :button-id="buttonId"
    mount-menu-on-body
    :show-label="showLabel"
    :fully-control-value="fullyControlValue"
    :disabled="disabled"
    :clearable="clearable"
    :get-search-results="getSearchResults"
    :allow-unset="allowUnset"
    search
  >
    <template #nothing-selected>Select a group</template>
    <template #something-selected="{ value }">
      <div class="truncate text-foreground capitalize">
        {{ isArrayValue(value) ? value.map((v) => v.title).join(', ') : value.title }}
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col space-y-0.5">
        <span class="truncate capitalize">{{ item.title }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { useFormSelectChildInternals } from '@speckle/ui-components'
import { useApolloClient } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { FormSelectSavedViewGroup_SavedViewGroupFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment FormSelectSavedViewGroup_SavedViewGroup on SavedViewGroup {
    id
    title
    isUngroupedViewsGroup
  }
`)

const searchItemsQuery = graphql(`
  query FormSelectSavedViewGroup_SavedViewGroups(
    $projectId: String!
    $input: SavedViewGroupsInput!
  ) {
    project(id: $projectId) {
      id
      savedViewGroups(input: $input) {
        items {
          id
          ...FormSelectSavedViewGroup_SavedViewGroup
        }
        totalCount
        cursor
      }
    }
  }
`)

type ItemType = FormSelectSavedViewGroup_SavedViewGroupFragment
type ValueType = ItemType | ItemType[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = withDefaults(
  defineProps<{
    projectId: string
    resourceIdString: string
    modelValue?: ValueType
    fullyControlValue?: boolean
    label?: string
    disabled?: boolean
    showLabel?: boolean
    clearable?: boolean
    allowUnset?: boolean
    name?: string
  }>(),
  {
    clearable: false,
    allowUnset: false
  }
)

const apollo = useApolloClient().client
const labelId = useId()
const buttonId = useId()

const { selectedValue, isArrayValue } = useFormSelectChildInternals<ItemType>({
  props: toRefs(props),
  emit
})

const getSearchResults = async (search: string): Promise<ItemType[]> => {
  const res = await apollo
    .query({
      query: searchItemsQuery,
      variables: {
        projectId: props.projectId,
        input: {
          resourceIdString: props.resourceIdString,
          search,
          limit: 10
        }
      }
    })
    .catch(convertThrowIntoFetchResult)

  const items = res.data?.project.savedViewGroups.items || []
  return items
}
</script>

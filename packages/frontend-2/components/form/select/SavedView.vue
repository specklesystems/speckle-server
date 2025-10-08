<template>
  <FormSelectBase
    v-model="selectedValue"
    :name="name || 'savedView'"
    :label="label || 'View'"
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
    <template #nothing-selected>Select view</template>
    <template #something-selected="{ value }">
      <div class="truncate text-foreground capitalize">
        {{ isArrayValue(value) ? value.map((v) => v.name).join(', ') : value.name }}
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex gap-2 items-center">
        <img
          :src="item.thumbnailUrl"
          alt="thumbnail"
          class="w-20 h-[60px] object-cover rounded border border-outline-3 bg-foundation-page"
        />
        <span class="truncate capitalize">{{ item.name }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { useFormSelectChildInternals } from '@speckle/ui-components'
import { useApolloClient } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  FormSelectSavedView_SavedViewFragment,
  SavedViewVisibility
} from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment FormSelectSavedView_SavedView on SavedView {
    id
    name
    thumbnailUrl
  }
`)

const searchItemsQuery = graphql(`
  query FormSelectSavedView_SavedViews(
    $projectId: String!
    $input: ProjectSavedViewsInput!
  ) {
    project(id: $projectId) {
      id
      savedViews(input: $input) {
        items {
          id
          ...FormSelectSavedView_SavedView
        }
        totalCount
        cursor
      }
    }
  }
`)

type ItemType = FormSelectSavedView_SavedViewFragment
type ValueType = ItemType | ItemType[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = withDefaults(
  defineProps<{
    projectId: string
    resourceIdString?: string
    onlyVisibility?: SavedViewVisibility
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
          onlyVisibility: props.onlyVisibility,
          search,
          limit: 10
        }
      }
    })
    .catch(convertThrowIntoFetchResult)

  const items = res.data?.project.savedViews.items || []
  return items
}
</script>

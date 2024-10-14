<template>
  <FormSelectBase
    v-model="selectedValue"
    :multiple="multiple"
    :search="true"
    :search-placeholder="searchPlaceholder"
    :get-search-results="invokeSearch"
    :show-optional="showOptional"
    :label="label"
    :show-label="showLabel"
    :name="name || 'projects'"
    :label-id="labelId"
    :button-id="buttonId"
    by="id"
  >
    <template #nothing-selected>
      <template v-if="selectorPlaceholder">
        {{ selectorPlaceholder }}
      </template>
      <template v-else>
        {{ multiple ? 'Select projects' : 'Select a project' }}
      </template>
    </template>
    <template #something-selected="{ value }">
      <template v-if="isMultiItemArrayValue(value)">
        <div ref="elementToWatchForChanges" class="flex items-center space-x-0.5">
          <div
            ref="itemContainer"
            class="flex flex-wrap overflow-hidden space-x-0.5 h-6"
          >
            <div v-for="(item, i) in value" :key="item.id" class="text-foreground">
              {{ item.name + (i < value.length - 1 ? ', ' : '') }}
            </div>
          </div>
          <div v-if="hiddenSelectedItemCount > 0" class="text-foreground-2 normal">
            +{{ hiddenSelectedItemCount }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex items-center">
          <span class="truncate text-foreground">
            {{ (isArrayValue(value) ? value[0] : value).name }}
          </span>
        </div>
      </template>
    </template>
    <template #option="{ item }">
      <div class="flex items-center">
        <span class="truncate">{{ item.name }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import type { PropType } from 'vue'
import { Roles } from '@speckle/shared'
import type { Nullable, Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { FormSelectProjects_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { useFormSelectChildInternals } from '~~/lib/form/composables/select'
import { useApolloClient } from '@vue/apollo-composable'
import { searchProjectsQuery } from '~~/lib/form/graphql/queries'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

type ValueType =
  | FormSelectProjects_ProjectFragment
  | FormSelectProjects_ProjectFragment[]
  | undefined

graphql(`
  fragment FormSelectProjects_Project on Project {
    id
    name
  }
`)

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps({
  /**
   * Whether to allow selecting multiple items
   */
  multiple: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: [Object, Array] as PropType<ValueType>,
    default: undefined
  },
  /**
   * Search placeholder text
   */
  searchPlaceholder: {
    type: String,
    default: 'Search projects'
  },
  selectorPlaceholder: {
    type: String as PropType<Optional<string>>,
    default: ''
  },
  /**
   * Label is required at the very least for screen-readers
   */
  label: {
    type: String,
    required: true
  },
  /**
   * Whether to show the label visually
   */
  showLabel: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to show the optional text
   */
  showOptional: {
    type: Boolean,
    default: false
  },
  name: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  /**
   * Whether to only return owned projects from server
   */
  ownedOnly: {
    type: Boolean,
    default: false
  }
})

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)
const labelId = useId()
const buttonId = useId()

const { selectedValue, hiddenSelectedItemCount, isArrayValue, isMultiItemArrayValue } =
  useFormSelectChildInternals<FormSelectProjects_ProjectFragment>({
    props: toRefs(props),
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  })

const apollo = useApolloClient().client
const { isLoggedIn } = useActiveUser()

const invokeSearch = async (search: string) => {
  if (!isLoggedIn.value) return []
  const results = await apollo.query({
    query: searchProjectsQuery,
    variables: {
      search: search.trim().length ? search : null,
      onlyWithRoles: props.ownedOnly ? [Roles.Stream.Owner] : null
    }
  })
  return results.data.activeUser?.projects.items || []
}
</script>

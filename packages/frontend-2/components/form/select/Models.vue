<template>
  <FormSelectBase
    ref="select"
    v-model="selectedValue"
    :multiple="multiple"
    :search="true"
    :search-placeholder="searchPlaceholder"
    :get-search-results="invokeSearch"
    :label="label"
    :show-label="showLabel"
    :name="name || 'models'"
    :rules="rules"
    :validate-on-value-update="validateOnValueUpdate"
    :allow-unset="allowUnset"
    :show-required="showRequired"
    :label-id="labelId"
    :button-id="buttonId"
    mount-menu-on-body
    by="id"
  >
    <template #nothing-selected>
      <template v-if="selectorPlaceholder">
        {{ selectorPlaceholder }}
      </template>
      <template v-else>
        {{ multiple ? 'Select models' : 'Select a model' }}
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
            {{ value.name }}
          </span>
        </div>
      </template>
    </template>
    <template #option="{ item }">
      <div class="flex items-center">
        <span class="truncate text-body-2xs">{{ item.name }}</span>
      </div>
    </template>
    <template #nothing-found>
      <div class="px-1">
        {{ nothingFoundText || 'No models found in selected project' }}
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { type Nullable, type Optional } from '@speckle/shared'
import { FormSelectBase, useFormSelectChildInternals } from '@speckle/ui-components'
import { useApolloClient } from '@vue/apollo-composable'
import { type RuleExpression } from 'vee-validate'
import { type PropType } from 'vue'
import { graphql } from '~/lib/common/generated/gql'
import type { FormSelectModels_ModelFragment } from '~/lib/common/generated/gql/graphql'
import { searchModelsQuery } from '~/lib/form/graphql/queries'

graphql(`
  fragment FormSelectModels_Model on Model {
    id
    name
  }
`)

type ItemType = FormSelectModels_ModelFragment
type ValueType = ItemType | ItemType[] | undefined

const emit = defineEmits<(e: 'update:modelValue', v: ValueType) => void>()

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
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
    default: 'Search models'
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
  name: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  rules: {
    type: [String, Object, Function, Array] as PropType<RuleExpression<ValueType>>,
    default: undefined
  },
  validateOnValueUpdate: {
    type: Boolean,
    default: false
  },
  allowUnset: {
    type: Boolean,
    default: true
  },
  showRequired: {
    type: Boolean,
    default: false
  },
  nothingFoundText: {
    type: String
  }
})

const select = ref(null as Nullable<{ triggerSearch: () => Promise<void> }>)

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)
const labelId = useId()
const buttonId = useId()

const coreParams = computed(() => ({ projectId: props.projectId }))
const { selectedValue, hiddenSelectedItemCount, isMultiItemArrayValue } =
  useFormSelectChildInternals<ItemType>({
    props: toRefs(props),
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  })

const apollo = useApolloClient().client
const { isLoggedIn } = useActiveUser()

const invokeSearch = async (search: string) => {
  if (!isLoggedIn.value) return []
  const results = await apollo.query({
    query: searchModelsQuery,
    variables: {
      search: search.trim().length ? search : null,
      ...coreParams.value
    }
  })
  return results.data.project.models.items || []
}

watch(coreParams, () => {
  // Re-trigger search
  if (!select.value) return
  void select.value.triggerSearch()
})
</script>

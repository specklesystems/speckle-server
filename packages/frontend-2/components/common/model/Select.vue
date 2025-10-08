<template>
  <FormSelectBase
    v-model="selectedValue"
    :items="items"
    :name="name || 'models'"
    :label="label || 'Models'"
    :show-label="showLabel"
    :multiple="multiple"
    :disabled="!items.length"
    :allow-unset="allowUnset"
    :label-id="labelId"
    :button-id="buttonId"
    menu-max-height-classes="max-h-[30vh]"
    :help="help"
    by="id"
  >
    <template #nothing-selected>
      <div class="label label--light">
        {{ multiple ? 'Select models' : 'Select a model' }}
      </div>
    </template>
    <template #something-selected="{ value }">
      <template v-if="isMultiItemArrayValue(value)">
        <div ref="elementToWatchForChanges" class="flex items-center space-x-0.5">
          <div ref="itemContainer" class="flex flex-wrap overflow-hidden space-x-0.5">
            <span
              v-for="branch in value"
              :key="branch.id"
              class="text-foreground normal"
            >
              {{ branch.name }}
            </span>
          </div>
          <div v-if="hiddenSelectedItemCount > 0" class="text-foreground-2 normal">
            +{{ hiddenSelectedItemCount }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex items-center">
          <span class="truncate label label--light">
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
import { useQuery } from '@vue/apollo-composable'
import type { Nullable, Optional } from '@speckle/shared'
import { projectModelsSelectorValuesQuery } from '~~/lib/common/graphql/queries'
import type { CommonModelSelectorModelFragment } from '~~/lib/common/generated/gql/graphql'
import { useFormSelectChildInternals } from '~~/lib/form/composables/select'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment CommonModelSelectorModel on Model {
    id
    name
  }
`)

type BranchItem = CommonModelSelectorModelFragment

type ValueType = BranchItem | BranchItem[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  multiple: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: [Object, Array] as PropType<ValueType>,
    default: undefined
  },
  label: {
    type: String,
    default: undefined
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    default: undefined
  },
  excludedIds: {
    type: Array as PropType<Optional<string[]>>,
    default: undefined
  },
  allowUnset: {
    type: Boolean,
    default: false
  },
  help: {
    type: String,
    default: undefined
  }
})

const { result, onResult, fetchMore } = useQuery(
  projectModelsSelectorValuesQuery,
  () => ({
    projectId: props.projectId,
    cursor: null as Nullable<string>
  })
)

const buttonId = useId()
const labelId = useId()
const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)

const { selectedValue, isMultiItemArrayValue, isArrayValue, hiddenSelectedItemCount } =
  useFormSelectChildInternals({
    props: toRefs(props),
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  })

const items = computed(() => {
  const queryItems = result.value?.project?.models.items || []
  if (!props.excludedIds?.length) return queryItems
  return queryItems.filter((i) => !(props.excludedIds || []).includes(i.id))
})

onResult((res) => {
  if (!res.data?.project) return
  if (res.data.project?.models.totalCount <= res.data.project?.models.items.length)
    return
  if (!res.data.project.models.cursor) return

  // Load more
  const cursor = res.data.project.models.cursor
  fetchMore({
    variables: {
      cursor
    }
  })
})
</script>

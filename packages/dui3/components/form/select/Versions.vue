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
    :name="name || 'versions'"
    :validate-on-value-update="validateOnValueUpdate"
    by="id"
  >
    <template #something-selected="{ value }">
      <div class="text-normal">
        {{ value.message }}
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex items-center">
        <span class="truncate">{{ `${item.message} - (${item.id})` }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { Nullable, Optional } from '@speckle/shared'
import { useGetModelVersions } from '~/lib/graphql/composables'
import { FormSelectBase, useFormSelectChildInternals } from '@speckle/ui-components'
import { RuleExpression } from 'vee-validate'
import { PropType } from 'vue'
import { VersionsSelectItemType } from '~/lib/form/select/types'

type ItemType = VersionsSelectItemType
type ValueType = ItemType | ItemType[] | undefined

const emit = defineEmits<(e: 'update:modelValue', v: ValueType) => void>()

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  modelId: {
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
  }
})

const select = ref(null as Nullable<{ triggerSearch: () => Promise<void> }>)
// const select2 = ref(null as Nullable<InstanceType<typeof FormSelectBase>>)
// select2.value?.triggerSearch

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)

const { selectedValue } = useFormSelectChildInternals<ItemType>({
  props: toRefs(props),
  emit,
  dynamicVisibility: { elementToWatchForChanges, itemContainer }
})

const modelsParams = computed(() => ({ projectId: props.projectId }))
const getVersions = useGetModelVersions()

const versions = ref<VersionsSelectItemType[]>()

const invokeSearch = async () => {
  if (!props.projectId) return []

  const res = (await getVersions(
    props.projectId,
    props.modelId
  )) as VersionsSelectItemType[]
  console.log(res)
  versions.value = res
  return versions.value || []
}

watch(modelsParams, () => {
  // Re-trigger search
  if (!select.value) return
  void select.value.triggerSearch()
})
</script>

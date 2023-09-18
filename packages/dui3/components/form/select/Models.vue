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
    :validate-on-value-update="validateOnValueUpdate"
    by="id"
  >
    <template #something-selected="{ value }">
      <div class="text-normal">
        {{ value.name }}
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex items-center justify-between">
        <div class="w-[85%]">
          <span class="truncate" :class="item.id ? '' : 'text-green-500'">
            {{ item.name }}
          </span>
        </div>
        <div v-if="create && !item.id" class="w-[15%]">
          <FormButton
            v-tippy="'Create Model'"
            color="success"
            text
            hide-text
            :icon-left="DocumentPlusIcon"
            @click="createModel(item.name)"
          ></FormButton>
        </div>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { DocumentPlusIcon } from '@heroicons/vue/24/outline'
import { Nullable, Optional } from '@speckle/shared'
import { useGetProjectModels, useCreateNewModel } from '~/lib/graphql/composables'
import { FormSelectBase, useFormSelectChildInternals } from '@speckle/ui-components'
import { RuleExpression } from 'vee-validate'
import { PropType } from 'vue'
import { ModelsSelectItemType } from '~/lib/form/select/types'

type ItemType = ModelsSelectItemType
type ValueType = ItemType | ItemType[] | undefined

const emit = defineEmits<(e: 'update:modelValue', v: ValueType) => void>()

const props = defineProps({
  create: {
    type: Boolean,
    default: false
  },
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

const createNewModel = useCreateNewModel()

const createModel = async (name: string) => {
  const res = await createNewModel({ name, projectId: props.projectId })
  emit('update:modelValue', {
    id: res.data?.modelMutations.create.id,
    name
  } as ValueType)
}

const modelsParams = computed(() => ({ projectId: props.projectId }))
const getModels = useGetProjectModels()

const models = ref<ModelsSelectItemType[]>()

const invokeSearch = async (search: string) => {
  if (!props.projectId) return []

  const addModel = ref<ModelsSelectItemType>({ name: search })
  models.value = []
  if (search !== '') {
    models.value = [addModel.value]
  }

  const res = (await getModels(props.projectId, search)) as ModelsSelectItemType[]
  models.value = models.value.concat(res)
  return models.value || []
}

watch(modelsParams, () => {
  // Re-trigger search
  if (!select.value) return
  void select.value.triggerSearch()
})
</script>

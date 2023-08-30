<template>
  <div>
    <div class="flex flex-col max-w-sm w-full mx-auto space-y-4">
      <FormSelectBase
        v-model="selectedValue"
        :multiple="false"
        :search="true"
        search-placeholder="Projects"
        :get-search-results="invokeSearch"
        label="Project"
        :show-label="true"
        name="projects"
        :rules="[ValidationHelpers.isRequired]"
      >
        <template #something-selected="{ value }">
          <div class="text-normal">
            {{ value.name }}
          </div>
        </template>
        <template #option="{ item }">
          <div class="flex items-center">
            <span class="truncate">{{ item.name }}</span>
          </div>
        </template>
      </FormSelectBase>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ValidationHelpers, useFormSelectChildInternals } from '@speckle/ui-components'
import { useGetProjects } from '~/lib/graphql/composables'
import { PropType } from 'vue'
import { RuleExpression } from 'vee-validate'
import { Nullable, Optional } from '@speckle/shared'
import { ProjectsSelectItemType } from 'lib/form/select/types'

type ItemType = ProjectsSelectItemType
type ValueType = ItemType | ItemType[] | undefined

const emit = defineEmits<(e: 'update:modelValue', v: ValueType) => void>()

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

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)

const { selectedValue } = useFormSelectChildInternals<ItemType>({
  props: toRefs(props),
  emit,
  dynamicVisibility: { elementToWatchForChanges, itemContainer }
})

const getProjects = useGetProjects()

const projects = ref<ProjectsSelectItemType[]>()

const invokeSearch = async (search: string) => {
  const res = (await getProjects(search)) as ProjectsSelectItemType[]
  console.log(res)
  projects.value = res
  return projects.value || []
}
</script>

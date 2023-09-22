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
          <div class="flex items-center justify-between">
            <div class="w-[85%]">
              <span class="truncate" :class="item.id ? '' : 'text-green-500'">
                {{ item.name }}
              </span>
            </div>
            <div v-if="create && !item.id" class="w-[15%]">
              <FormButton
                v-tippy="'Create Project'"
                color="success"
                text
                hide-text
                :icon-left="FolderPlusIcon"
                @click="createProject(item.name)"
              ></FormButton>
            </div>
          </div>
        </template>
      </FormSelectBase>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FolderPlusIcon } from '@heroicons/vue/24/outline'
import { ValidationHelpers, useFormSelectChildInternals } from '@speckle/ui-components'
import { useGetProjects, useCreateNewProject } from '~/lib/graphql/composables'
import { PropType } from 'vue'
import { RuleExpression } from 'vee-validate'
import { Nullable, Optional } from '@speckle/shared'
import { ProjectsSelectItemType } from 'lib/form/select/types'

type ItemType = ProjectsSelectItemType
type ValueType = ItemType | ItemType[] | undefined

const emit = defineEmits<(e: 'update:modelValue', v: ValueType) => void>()

const props = defineProps({
  create: {
    type: Boolean,
    default: false
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

const createNewProject = useCreateNewProject()
const getProjects = useGetProjects()

const projects = ref<ProjectsSelectItemType[]>()

const createProject = async (name: string) => {
  const res = await createNewProject({ name })
  emit('update:modelValue', {
    id: res.data?.projectMutations.create.id,
    name
  } as ValueType)
}

const invokeSearch = async (search: string) => {
  projects.value = []
  if (!props.create && search !== '') {
    const addProject = ref<ProjectsSelectItemType>({ name: search })
    projects.value = [addProject.value]
  }
  const res = (await getProjects(search)) as ProjectsSelectItemType[]
  projects.value = projects.value.concat(res)
  return projects.value || []
}
</script>

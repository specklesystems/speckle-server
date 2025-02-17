<template>
  <FormSelectBase
    v-model="selectedValue"
    :multiple="multiple"
    :items="users"
    :search="search"
    :filter-predicate="searchFilterPredicate"
    :search-placeholder="searchPlaceholder"
    :label="label"
    :show-label="showLabel"
    :name="name || 'users'"
    :label-id="labelId"
    :button-id="buttonId"
    by="id"
  >
    <template #nothing-selected>
      <template v-if="selectorPlaceholder">
        {{ selectorPlaceholder }}
      </template>
      <template v-else>
        {{ multiple ? 'Select users' : 'Select a user' }}
      </template>
    </template>
    <template #something-selected="{ value }">
      <template v-if="isMultiItemArrayValue(value)">
        <div ref="elementToWatchForChanges" class="flex items-center space-x-0.5">
          <div
            ref="itemContainer"
            class="flex flex-wrap overflow-hidden space-x-0.5 h-6"
          >
            <UserAvatar
              v-for="user in value"
              :key="user.id"
              :user="user"
              no-border
              size="xs"
            />
          </div>
          <div v-if="hiddenSelectedItemCount > 0" class="text-foreground-2 normal">
            +{{ hiddenSelectedItemCount }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex items-center overflow-hidden">
          <UserAvatar
            :user="isArrayValue(value) ? value[0] : value"
            no-border
            class="mr-2"
            size="xs"
          />
          <span class="truncate label label--light min-w-0">
            {{ (isArrayValue(value) ? value[0] : value).name }}
          </span>
        </div>
      </template>
    </template>
    <template #option="{ item }">
      <div class="flex items-center">
        <UserAvatar :user="item" no-border class="mr-2" size="sm" />
        <span class="truncate text-body-2xs">{{ item.name }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import type { PropType } from 'vue'
import type { Nullable, Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { FormUsersSelectItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useFormSelectChildInternals } from '~~/lib/form/composables/select'

type ValueType = FormUsersSelectItemFragment | FormUsersSelectItemFragment[] | undefined

graphql(`
  fragment FormUsersSelectItem on LimitedUser {
    id
    name
    avatar
  }
`)

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps({
  /**
   * Whether to allow selecting multiple users
   */
  multiple: {
    type: Boolean,
    default: false
  },
  users: {
    type: Array as PropType<FormUsersSelectItemFragment[]>,
    required: true
  },
  modelValue: {
    type: [Object, Array] as PropType<ValueType>,
    default: undefined
  },
  /**
   * Whether to allow filtering users through a search box
   */
  search: {
    type: Boolean,
    default: false
  },
  /**
   * Search placeholder text
   */
  searchPlaceholder: {
    type: String,
    default: 'Search people'
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
  }
})

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)
const labelId = useId()
const buttonId = useId()

const { selectedValue, hiddenSelectedItemCount, isArrayValue, isMultiItemArrayValue } =
  useFormSelectChildInternals<FormUsersSelectItemFragment>({
    props: toRefs(props),
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  })

const searchFilterPredicate = (i: FormUsersSelectItemFragment, search: string) =>
  i.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())
</script>

<template>
  <FormSelectBase
    v-model="selectedValue"
    :multiple="multiple"
    :items="users"
    :search="search"
    :search-filter-predicate="searchFilterPredicate"
    :search-placeholder="searchPlaceholder"
    :label="label"
    :show-label="showLabel"
    :name="name"
    by="id"
  >
    <template #nothing-selected>Select a user</template>
    <template #something-selected="{ value }">
      {{ isArray(value) ? value.map((u) => u.name).join(', ') : value.name }}
    </template>
    <template #option="{ item }">{{ item.name }}</template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { FormUsersSelectItemFragment } from '~~/lib/common/generated/gql/graphql'
import { isArray } from 'lodash-es'

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

const selectedValue = computed({
  get: () => {
    const currentValue = props.modelValue
    if (props.multiple) {
      return isArray(currentValue) ? currentValue : []
    } else {
      return isArray(currentValue) ? undefined : currentValue
    }
  },
  set: (newVal) => {
    if (props.multiple && !isArray(newVal)) {
      console.warn(
        'Attempting to set non-array value in Users selector w/ multiple=true'
      )
      return
    } else if (!props.multiple && isArray(newVal)) {
      console.warn('Attempting to set array value in Users selector w/ multiple=false')
      return
    }

    emit('update:modelValue', props.multiple ? newVal || [] : newVal)
  }
})

const searchFilterPredicate = (i: FormUsersSelectItemFragment, search: string) =>
  i.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())
</script>

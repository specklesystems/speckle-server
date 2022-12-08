<template>
  <Listbox v-model="value" :multiple="multiple" by="id" as="div">
    <ListboxButton>
      <template v-if="!value || (isArray(value) && !value.length)">
        <slot name="nothing-selected">
          {{ multiple ? 'Select users' : 'Select a user' }}
        </slot>
      </template>
      <template v-else>
        {{ isArray(value) ? value.map((u) => u.name).join(', ') : value.name }}
      </template>
    </ListboxButton>
    <ListboxOptions>
      <ListboxOption v-for="user in users" :key="user.id" :value="user">
        {{ user.name }}
      </ListboxOption>
    </ListboxOptions>
  </Listbox>
</template>
<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { isArray } from 'lodash-es'
import { PropType } from 'vue'
import { graphql } from '~~/lib/common/generated/gql'
import { FormUsersSelectItemFragment } from '~~/lib/common/generated/gql/graphql'

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
  }
})

const value = computed({
  get: () => {
    const currentValue = props.modelValue
    return props.multiple ? currentValue || [] : currentValue
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
</script>

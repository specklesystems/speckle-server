<template>
  <Listbox v-model="value" :multiple="multiple" by="id" as="div">
    <ListboxLabel
      class="block label text-foreground"
      :class="{ 'sr-only': !showLabel }"
    >
      {{ label }}
    </ListboxLabel>
    <div class="relative mt-1">
      <ListboxButton
        class="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
      >
        <span class="block truncate">
          <template v-if="!value || (isArray(value) && !value.length)">
            <slot name="nothing-selected">
              {{ label }}
            </slot>
          </template>
          <template v-else>
            {{ isArray(value) ? value.map((u) => u.name).join(', ') : value.name }}
          </template>
        </span>
        <span
          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
        >
          <ChevronDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </ListboxButton>
      <Transition
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
        >
          <ListboxOption
            v-for="user in users"
            :key="user.id"
            v-slot="{ active, selected }"
            :value="user"
          >
            <li
              :class="[
                active ? 'text-white bg-indigo-600' : 'text-gray-900',
                'relative cursor-default select-none py-2 pl-3 pr-9'
              ]"
            >
              <span
                :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']"
              >
                {{ user.name }}
              </span>

              <span
                v-if="selected"
                :class="[
                  active ? 'text-white' : 'text-indigo-600',
                  'absolute inset-y-0 right-0 flex items-center pr-4'
                ]"
              >
                <CheckIcon class="h-5 w-5" aria-hidden="true" />
              </span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </Transition>
    </div>
  </Listbox>
</template>
<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  ListboxLabel
} from '@headlessui/vue'
import { ChevronDownIcon, CheckIcon } from '@heroicons/vue/24/solid'
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

<template>
  <Listbox v-model="value" :name="name" :multiple="multiple" by="id" as="div">
    <ListboxLabel
      class="block label text-foreground"
      :class="{ 'sr-only': !showLabel }"
    >
      {{ label }}
    </ListboxLabel>
    <div class="relative mt-1">
      <ListboxButton
        v-slot="{ open }"
        class="normal w-full cursor-default rounded-lg bg-foundation py-2 px-3 focus:outline-none focus:ring-1 focus:border-outline-1 focus:ring-outline-1 flex items-center"
      >
        <span class="block truncate grow text-left">
          <template v-if="!value || (isArray(value) && !value.length)">
            <slot name="nothing-selected">
              {{ label }}
            </slot>
          </template>
          <template v-else>
            {{ isArray(value) ? value.map((u) => u.name).join(', ') : value.name }}
          </template>
        </span>
        <span class="pointer-events-none shrink-0 ml-1">
          <ChevronUpIcon
            v-if="open"
            class="h-4 w-4 text-foreground"
            aria-hidden="true"
          />
          <ChevronDownIcon v-else class="h-4 w-4 text-foreground" aria-hidden="true" />
        </span>
      </ListboxButton>
      <Transition
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute z-10 mt-1 max-h-60 w-full overflow-auto simple-scrollbar rounded bg-foundation-2 py-1 label label--light shadow-md focus:outline-none"
          @focus="searchInput?.focus()"
        >
          <label v-if="search" class="flex flex-col mx-1">
            <span class="sr-only label text-foreground">Search</span>
            <div class="relative">
              <div
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2"
              >
                <MagnifyingGlassIcon class="h-5 w-5 text-foreground" />
              </div>
              <input
                ref="searchInput"
                v-model="searchValue"
                type="text"
                class="pl-9 w-full border-0 bg-foundation-page rounded placeholder:font-normal normal placeholder:text-foreground-2 focus:outline-none focus:ring-1 focus:border-outline-1 focus:ring-outline-1"
                :placeholder="searchPlaceholder"
              />
            </div>
          </label>
          <ListboxOption
            v-for="user in filteredItems"
            :key="user.id"
            v-slot="{ active, selected }"
            :value="user"
          >
            <li
              :class="[
                active ? 'text-primary' : 'text-foreground',
                'relative cursor-default select-none py-1.5 pl-3 pr-9'
              ]"
            >
              <span :class="['block truncate']">
                {{ user.name }}
              </span>

              <span
                v-if="selected"
                :class="[
                  active ? 'text-primary' : 'text-foreground',
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
import {
  ChevronDownIcon,
  CheckIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/solid'
import { isArray } from 'lodash-es'
import { PropType } from 'vue'
import { Nullable, Optional } from '@speckle/shared'
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

const searchInput = ref(null as Nullable<HTMLInputElement>)
const searchValue = ref('')

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

const filteredItems = computed(() => {
  const searchVal = searchValue.value
  if (!props.search || !searchVal?.length) return props.users
  return props.users.filter((u) =>
    u.name.toLocaleLowerCase().includes(searchVal.toLocaleLowerCase())
  )
})
</script>

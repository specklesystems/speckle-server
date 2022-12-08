<template>
  <Listbox v-model="value" :name="name" :multiple="multiple" :by="by" as="div">
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
            <slot name="something-selected" :value="value">
              {{ simpleDisplayText(value) }}
            </slot>
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
          class="absolute z-10 mt-1 w-full rounded bg-foundation-2 py-1 label label--light shadow-md focus:outline-none"
          @focus="searchInput?.focus()"
        >
          <label v-if="hasSearch" class="flex flex-col mx-1 mb-1">
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
          <div
            class="overflow-auto simple-scrollbar"
            :class="[hasSearch ? 'max-h-52' : 'max-h-60']"
          >
            <ListboxOption
              v-for="item in filteredItems"
              :key="itemKey(item)"
              v-slot="{ active, selected }"
              :value="item"
            >
              <li
                :class="[
                  active ? 'text-primary' : 'text-foreground',
                  'relative cursor-default select-none py-1.5 pl-3 pr-9'
                ]"
              >
                <span :class="['block truncate']">
                  <slot
                    name="option"
                    :item="item"
                    :active="active"
                    :selected="selected"
                  >
                    {{ simpleDisplayText(item) }}
                  </slot>
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
          </div>
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

type SingleItem = Record<string, unknown>
type ValueType = SingleItem | SingleItem[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array as PropType<SingleItem[]>,
    required: true
  },
  modelValue: {
    type: [Object, Array, String] as PropType<ValueType>,
    default: undefined
  },
  /**
   * Whether to enable the search bar. To enable you must pass in searchFilterPredicate also
   */
  search: {
    type: Boolean,
    default: false
  },
  /**
   * This will be invoked to filter items based on whatever is entered inside the search bar. Return
   * true if item fits the search conditions.
   */
  searchFilterPredicate: {
    type: Function as PropType<
      Optional<(item: SingleItem, searchString: string) => boolean>
    >,
    default: undefined
  },
  searchPlaceholder: {
    type: String,
    default: 'Search'
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
  /**
   * Objects will be compared by the values in the specified prop
   */
  by: {
    type: String,
    required: true
  }
})

const searchInput = ref(null as Nullable<HTMLInputElement>)
const searchValue = ref('')

const hasSearch = computed(() => !!(props.search && props.searchFilterPredicate))

const value = computed({
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

    if (props.multiple) {
      emit('update:modelValue', newVal || [])
    } else {
      const currentVal = value.value
      const isUnset =
        currentVal &&
        newVal &&
        itemKey(currentVal as SingleItem) === itemKey(newVal as SingleItem)
      emit('update:modelValue', isUnset ? undefined : newVal)
    }
  }
})

const filteredItems = computed(() => {
  const searchVal = searchValue.value
  if (!hasSearch.value || !searchVal?.length) return props.items

  return props.items.filter((i) => props.searchFilterPredicate?.(i, searchVal) || false)
})

const simpleDisplayText = (v: ValueType) => JSON.stringify(v)
const itemKey = (v: SingleItem): string | number => v[props.by] as string
</script>

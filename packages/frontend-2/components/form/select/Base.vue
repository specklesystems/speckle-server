<template>
  <div>
    <Listbox
      v-model="wrappedValue"
      :name="name"
      :multiple="multiple"
      :by="by"
      :disabled="isDisabled"
      as="div"
    >
      <ListboxLabel
        class="block label text-foreground"
        :class="{ 'sr-only': !showLabel }"
      >
        {{ label }}
      </ListboxLabel>
      <div :class="['relative', showLabel ? 'mt-1' : '']">
        <ListboxButton v-slot="{ open }" :class="buttonClasses">
          <span class="block truncate grow text-left">
            <template
              v-if="!wrappedValue || (isArray(wrappedValue) && !wrappedValue.length)"
            >
              <slot name="nothing-selected">
                {{ label }}
              </slot>
            </template>
            <template v-else>
              <slot name="something-selected" :value="wrappedValue">
                {{ simpleDisplayText(wrappedValue) }}
              </slot>
            </template>
          </span>
          <span class="pointer-events-none shrink-0 ml-1">
            <ChevronUpIcon
              v-if="open"
              class="h-4 w-4 text-foreground"
              aria-hidden="true"
            />
            <ChevronDownIcon
              v-else
              class="h-4 w-4 text-foreground"
              aria-hidden="true"
            />
          </span>
        </ListboxButton>
        <Transition
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute z-10 mt-1 w-full rounded-lg bg-foundation-2 py-1 label label--light outline outline-2 outline-primary-muted focus:outline-none shadow"
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
                    'relative transition cursor-pointer select-none py-1.5 pl-3',
                    !hideCheckmarks ? 'pr-9' : ''
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
                    v-if="!hideCheckmarks && selected"
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
    <p
      v-if="helpTipId"
      :id="helpTipId"
      class="mt-2 ml-3 text-sm"
      :class="helpTipClasses"
    >
      {{ helpTip }}
    </p>
  </div>
</template>
<script setup lang="ts">
// Vue components don't support generic props, so having to rely on any
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

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
import { RuleExpression, useField } from 'vee-validate'
import { nanoid } from 'nanoid'

type ButtonStyle = 'base' | 'simple'
type SingleItem = any
type ValueType = SingleItem | SingleItem[] | undefined

defineEmits<{
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
    type: String,
    required: true
  },
  /**
   * Objects will be compared by the values in the specified prop
   */
  by: {
    type: String,
    required: false
  },
  disabled: {
    type: Boolean as PropType<Optional<boolean>>,
    default: false
  },
  buttonStyle: {
    type: String as PropType<Optional<ButtonStyle>>,
    default: 'base'
  },
  hideCheckmarks: {
    type: Boolean as PropType<Optional<boolean>>,
    default: false
  },
  allowUnset: {
    type: Boolean as PropType<Optional<boolean>>,
    default: true
  },
  /**
   * Validation stuff
   */
  rules: {
    type: [String, Object, Function, Array] as PropType<RuleExpression<string>>,
    default: undefined
  },
  /**
   * vee-validate validation() on component mount
   */
  validateOnMount: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to trigger validation whenever the value changes
   */
  validateOnValueUpdate: {
    type: Boolean,
    default: false
  },
  /**
   * Will replace the generic "Value" text with the name of the input in error messages
   */
  useLabelInErrors: {
    type: Boolean,
    default: true
  },
  /**
   * Optional help text
   */
  help: {
    type: String as PropType<Optional<string>>,
    default: undefined
  }
})

const { value, errorMessage: error } = useField<ValueType>(props.name, props.rules, {
  validateOnMount: props.validateOnMount,
  validateOnValueUpdate: props.validateOnValueUpdate,
  initialValue: props.modelValue
})

const searchInput = ref(null as Nullable<HTMLInputElement>)
const searchValue = ref('')

const internalHelpTipId = ref(nanoid())

const isDisabled = computed(() => props.disabled || !props.items.length)
const title = computed(() => unref(props.label) || unref(props.name))
const errorMessage = computed(() => {
  const base = error.value
  if (!base || !unref(props.useLabelInErrors)) return base
  return base.replace('Value', title.value)
})
const helpTip = computed(() => errorMessage.value || unref(props.help))
const hasHelpTip = computed(() => !!helpTip.value)
const helpTipId = computed(() =>
  hasHelpTip.value ? `${unref(props.name)}-${internalHelpTipId.value}` : undefined
)
const helpTipClasses = computed((): string =>
  error.value ? 'text-danger' : 'text-foreground-2'
)

const buttonClasses = computed(() => {
  const classParts = [
    'normal w-full rounded-lg cursor-pointer transition',
    'flex items-center'
  ]

  if (props.buttonStyle !== 'simple') {
    classParts.push('py-2 px-3 outline outline-2 outline-primary-muted hover:shadow ')
    classParts.push(
      isDisabled.value
        ? 'bg-foundation-disabled text-foreground-disabled'
        : 'bg-foundation text-foreground'
    )
  }

  if (isDisabled.value) classParts.push('cursor-not-allowed')

  return classParts.join(' ')
})

const hasSearch = computed(() => !!(props.search && props.searchFilterPredicate))

const wrappedValue = computed({
  get: () => {
    const currentValue = value.value
    if (props.multiple) {
      return isArray(currentValue) ? currentValue : []
    } else {
      return isArray(currentValue) ? undefined : currentValue
    }
  },
  set: (newVal) => {
    if (props.multiple && !isArray(newVal)) {
      console.warn('Attempting to set non-array value in selector w/ multiple=true')
      return
    } else if (!props.multiple && isArray(newVal)) {
      console.warn('Attempting to set array value in selector w/ multiple=false')
      return
    }

    if (props.multiple) {
      value.value = newVal || []
    } else {
      const currentVal = value.value
      const isUnset =
        props.allowUnset &&
        currentVal &&
        newVal &&
        itemKey(currentVal as SingleItem) === itemKey(newVal as SingleItem)
      value.value = isUnset ? undefined : newVal
    }
  }
})

const filteredItems = computed(() => {
  const searchVal = searchValue.value
  if (!hasSearch.value || !searchVal?.length) return props.items

  return props.items.filter((i) => props.searchFilterPredicate?.(i, searchVal) || false)
})

const simpleDisplayText = (v: ValueType) => JSON.stringify(v)
const itemKey = (v: SingleItem): string | number =>
  props.by ? (v[props.by] as string) : v
</script>

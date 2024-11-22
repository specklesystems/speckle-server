<template>
  <div>
    <Listbox
      :key="forceUpdateKey"
      v-model="wrappedValue"
      :name="name"
      :multiple="multiple"
      :by="by"
      :disabled="isDisabled"
      as="div"
      :class="{
        'md:flex md:items-center md:space-x-2 md:justify-between': isLeftLabelPosition
      }"
    >
      <div class="flex flex-col pb-1">
        <ListboxLabel
          :id="labelId"
          class="flex text-body-xs text-foreground font-medium"
          :class="[{ 'sr-only': !showLabel }, { 'items-center gap-1': showOptional }]"
          :for="buttonId"
        >
          {{ label }}
          <div v-if="showRequired" class="text-danger text-xs opacity-80">*</div>
          <div v-else-if="showOptional" class="text-body-2xs font-normal">
            (optional)
          </div>
        </ListboxLabel>
        <p
          v-if="helpTipId && isLeftLabelPosition"
          :id="helpTipId"
          class="text-xs"
          :class="helpTipClasses"
        >
          {{ helpTip }}
        </p>
      </div>
      <div :class="buttonsWrapperClasses">
        <!-- <div class="relative flex"> -->
        <ListboxButton
          :id="buttonId"
          ref="listboxButton"
          v-slot="{ open }"
          :class="buttonClasses"
        >
          <div class="flex items-center justify-between w-full">
            <div
              class="block truncate grow text-left text-xs sm:text-[13px]"
              :class="[hasValueSelected ? 'text-foreground' : 'text-foreground-2']"
            >
              <template
                v-if="!wrappedValue || (isArray(wrappedValue) && !wrappedValue.length)"
              >
                <slot name="nothing-selected">
                  {{ placeholder ? placeholder : label }}
                </slot>
              </template>
              <template v-else>
                <slot name="something-selected" :value="wrappedValue">
                  {{ simpleDisplayText(wrappedValue) }}
                </slot>
              </template>
            </div>
            <div class="pointer-events-none shrink-0 ml-1 flex items-center space-x-2">
              <ExclamationCircleIcon
                v-if="errorMessage"
                class="h-4 w-4 text-danger"
                aria-hidden="true"
              />
              <div
                v-else-if="!showLabel && showRequired"
                class="text-4xl text-danger opacity-50 h-4 w-4 leading-6"
              >
                *
              </div>
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
            </div>
          </div>
          <!-- Sync isOpen with dropdown open state -->
          <template v-if="(isOpen = open)"></template>
        </ListboxButton>
        <!-- </div> -->
        <!-- Clear Button -->
        <button
          v-if="renderClearButton"
          :class="clearButtonClasses"
          :disabled="disabled"
          @click="clearValue()"
        >
          <XMarkIcon class="w-3 h-3" />
        </button>
        <Transition
          v-if="isMounted"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <Teleport to="body" :disabled="!mountMenuOnBody">
            <ListboxOptions
              ref="menuEl"
              :class="listboxOptionsClasses"
              :style="listboxOptionsStyle"
              @focus="searchInput?.focus()"
            >
              <label v-if="hasSearch" class="flex flex-col mx-1 mb-1">
                <span class="sr-only label text-foreground">Search</span>
                <div class="relative">
                  <div
                    class="pointer-events-none absolute top-0 bottom-0 left-0 flex items-center pl-2"
                  >
                    <MagnifyingGlassIcon class="h-4 w-4 text-foreground-2" />
                  </div>
                  <input
                    ref="searchInput"
                    v-model="searchValue"
                    type="text"
                    class="py-1 pl-7 w-full bg-foundation placeholder:font-normal normal placeholder:text-foreground-2 text-[13px]"
                    :placeholder="searchPlaceholder"
                    @keydown.stop
                  />
                </div>
              </label>
              <div class="overflow-auto simple-scrollbar max-h-60">
                <div v-if="isAsyncSearchMode && isAsyncLoading" class="px-1">
                  <CommonLoadingBar :loading="true" />
                </div>
                <div v-else-if="isAsyncSearchMode && !currentItems.length">
                  <div class="text-foreground-2 text-center">
                    <slot name="nothing-found">Nothing found</slot>
                  </div>
                </div>
                <template v-if="!isAsyncSearchMode || !isAsyncLoading">
                  <ListboxOption
                    v-for="item in finalItems"
                    :key="itemKey(item)"
                    v-slot="{
                      active,
                      selected
                    }: {
                      active: boolean,
                      selected: boolean
                    }"
                    :value="(item as SingleItem)"
                    :disabled="disabledItemPredicate?.(item) || false"
                  >
                    <li
                      v-tippy="
                        disabledItemPredicate?.(item) ? disabledItemTooltip : undefined
                      "
                      :class="
                        listboxOptionClasses({
                          active,
                          disabled: disabledItemPredicate?.(item) || false
                        })
                      "
                    >
                      <span
                        class="block px-2 py-1.5 rounded-md"
                        :class="[
                          selected ? 'bg-highlight-3' : '',
                          !hideCheckmarks ? 'pr-8' : 'pr-2',
                          !disabledItemPredicate?.(item) && !selected
                            ? 'hover:bg-highlight-1'
                            : ''
                        ]"
                      >
                        <slot
                          name="option"
                          class="truncate"
                          :item="item"
                          :active="active"
                          :selected="selected"
                          :disabled="disabledItemPredicate?.(item) || false"
                        >
                          {{ simpleDisplayText(item) }}
                        </slot>

                        <span
                          v-if="!hideCheckmarks && selected"
                          :class="[
                            'absolute top-0 bottom-0 right-0 text-foreground flex items-center pr-4'
                          ]"
                        >
                          <CheckIcon class="h-4 w-4" aria-hidden="true" />
                        </span>
                      </span>
                    </li>
                  </ListboxOption>
                </template>
              </div>
            </ListboxOptions>
          </Teleport>
        </Transition>
      </div>
    </Listbox>
    <p
      v-if="helpTipId && !isLeftLabelPosition"
      :id="helpTipId"
      class="mt-2 text-xs"
      :class="helpTipClasses"
    >
      {{ helpTip }}
    </p>
  </div>
</template>
<script
  setup
  lang="ts"
  generic="SingleItem extends Record<string, unknown> | string | number"
>
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
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/20/solid'
import { debounce, isArray, isObjectLike } from 'lodash'
import type { CSSProperties, PropType, Ref } from 'vue'
import { computed, onMounted, ref, unref, watch } from 'vue'
import type { MaybeAsync, Nullable, Optional } from '@speckle/shared'
import { useField } from 'vee-validate'
import type { RuleExpression } from 'vee-validate'
import { nanoid } from 'nanoid'
import CommonLoadingBar from '~~/src/components/common/loading/Bar.vue'
import { useElementBounding, useMounted, useIntersectionObserver } from '@vueuse/core'
import type { LabelPosition } from '~~/src/composables/form/input'

type ButtonStyle = 'base' | 'simple' | 'tinted'
type ValueType = SingleItem | SingleItem[] | undefined
type InputSize = 'sm' | 'base' | 'lg' | 'xl'

const isObjectLikeType = (v: unknown): v is Record<string, unknown> => isObjectLike(v)

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps({
  size: {
    type: String as PropType<Optional<InputSize>>,
    default: undefined
  },
  multiple: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array as PropType<SingleItem[]>,
    default: () => []
  },
  modelValue: {
    type: [Object, Array, String] as PropType<ValueType>,
    default: undefined
  },
  /**
   * Whether to enable the search bar. You must also set one of the following:
   * * filterPredicate - to allow filtering passed in `items` based on search bar
   * * getSearchResults - to allow asynchronously loading items from server (props.items no longer required in this case,
   *  but can be used to prefill initial values)
   */
  search: {
    type: Boolean,
    default: false
  },
  /**
   * If search=true and this is set, you can use this to filter passed in items based on whatever
   * the user enters in the search bar
   */
  filterPredicate: {
    type: Function as PropType<
      Optional<(item: SingleItem, searchString: string) => boolean>
    >,
    default: undefined
  },
  /**
   * Set this to disable certain items in the list
   */
  disabledItemPredicate: {
    type: Function as PropType<Optional<(item: SingleItem) => boolean>>,
    default: undefined
  },
  /**
   * If search=true and this is set, you can use this to load data asynchronously depending
   * on the search query
   */
  getSearchResults: {
    type: Function as PropType<
      Optional<(searchString: string) => MaybeAsync<SingleItem[]>>
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
   * Optional text that replaces the label as the placeholder when set.
   */
  placeholder: {
    type: String
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
  clearable: {
    type: Boolean,
    default: false
  },
  /**
   * Validation stuff
   */
  rules: {
    type: [String, Object, Function, Array] as PropType<
      Optional<RuleExpression<ValueType>>
    >,
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
  },
  /**
   * @deprecated Use size attribute instead
   */
  fixedHeight: {
    type: Boolean,
    default: false
  },
  /**
   * By default component holds its own internal value state so that even if you don't have it tied up to a real `modelValue` ref somewhere
   * it knows its internal state and can report it on form submits.
   *
   * If you set this to true, its only going to rely on `modelValue` as its primary source of truth so that you can reject updates etc.
   */
  fullyControlValue: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to show the red "required" asterisk
   */
  showRequired: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to show the optional text
   */
  showOptional: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to mount the menu on the body instead of inside the component. Useful when select box is mounted within
   * dialog windows and the menu causes unnecessary overflow.
   */
  mountMenuOnBody: {
    type: Boolean,
    default: false
  },
  labelId: {
    type: String,
    default: undefined
  },
  buttonId: {
    type: String,
    default: undefined
  },
  /**
   * Tooltip shown on disabled items
   */
  disabledItemTooltip: {
    required: false,
    type: String
  },
  labelPosition: {
    type: String as PropType<LabelPosition>,
    default: 'top'
  }
})

const { value, errorMessage: error } = useField<ValueType>(props.name, props.rules, {
  validateOnMount: props.validateOnMount,
  validateOnValueUpdate: props.validateOnValueUpdate,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  initialValue: props.modelValue as ValueType
})

const isMounted = useMounted()

const searchInput = ref(null as Nullable<HTMLInputElement>)
const menuEl = ref(null as Nullable<{ el: Nullable<HTMLElement> }>)
const listboxButton = ref(null as Nullable<{ el: Nullable<HTMLButtonElement> }>)
const searchValue = ref('')
const currentItems = ref([]) as Ref<SingleItem[]>
const isAsyncLoading = ref(false)
const forceUpdateKey = ref(1)
const internalHelpTipId = ref(nanoid())
const isOpen = ref(false)

const listboxButtonBounding = useElementBounding(
  computed(() => listboxButton.value?.el),
  { windowResize: true, windowScroll: true, immediate: true }
)

useIntersectionObserver(
  computed(() => menuEl.value?.el),
  ([{ isIntersecting }]) => {
    if (isIntersecting && props.mountMenuOnBody) {
      listboxButtonBounding.update()
    }
  }
)

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

const isLeftLabelPosition = computed(() => props.labelPosition === 'left')

const renderClearButton = computed(
  () => props.buttonStyle !== 'simple' && props.clearable && !props.disabled
)

const sizeClasses = computed((): string => {
  if (!props.size) return ''

  switch (props.size) {
    case 'sm':
      return 'h-6 text-body-sm'
    case 'lg':
      return 'h-10 text-[13px]'
    case 'xl':
      return 'h-14 text-sm'
    case 'base':
    default:
      return 'h-8 text-body-sm'
  }
})

const buttonsWrapperClasses = computed(() => {
  const classParts: string[] = ['relative flex group']

  if (error.value) {
    classParts.push('hover:shadow rounded-md')
    classParts.push('text-danger-darker focus:border-danger')

    if (props.buttonStyle !== 'simple') {
      classParts.push('border border-danger')
    }
  } else if (props.buttonStyle !== 'simple') {
    classParts.push('rounded-md border')
    if (isOpen.value) {
      classParts.push('border-outline-4')
    } else {
      classParts.push('border-outline-2 hover:border-outline-5 focus:outline-0')
    }
  }

  if (props.fixedHeight) {
    classParts.push('h-8')
  } else if (sizeClasses.value?.length) {
    classParts.push(sizeClasses.value)
  }

  if (isLeftLabelPosition.value) {
    classParts.push('md:basis-1/2')
  }

  return classParts.join(' ')
})

const commonButtonClasses = computed(() => {
  const classParts: string[] = []

  if (props.buttonStyle !== 'simple') {
    classParts.push(
      isDisabled.value ? 'bg-foundation-disabled text-foreground-disabled' : ''
    )
  }

  if (isDisabled.value) classParts.push('cursor-not-allowed')

  return classParts.join(' ')
})

const clearButtonClasses = computed(() => {
  const classParts = [
    'relative z-[1]',
    'flex items-center justify-center text-center shrink-0',
    'rounded-r-md overflow-hidden transition-all',
    'text-foreground',
    hasValueSelected.value ? `w-6 ${commonButtonClasses.value}` : 'w-0'
  ]

  if (!isDisabled.value) {
    classParts.push(
      'hover:bg-primary hover:text-foreground-on-primary dark:text-foreground-on-primary'
    )
    if (props.buttonStyle === 'tinted') {
      classParts.push('bg-outline-3')
    } else {
      classParts.push('bg-primary-muted')
    }
  }

  return classParts.join(' ')
})

const buttonClasses = computed(() => {
  const classParts = [
    'relative z-[2]',
    'normal rounded-md cursor-pointer transition truncate flex-1',
    'flex items-center focus:outline-outline-4 focus:outline-1',
    commonButtonClasses.value
  ]

  if (props.buttonStyle !== 'simple') {
    classParts.push('p-2')

    if (!isDisabled.value) {
      if (props.buttonStyle === 'tinted') {
        classParts.push('bg-foundation text-foreground')
      } else {
        classParts.push('bg-foundation text-foreground')
      }
    }
  }

  if (renderClearButton.value && hasValueSelected.value) {
    classParts.push('rounded-r-none')
  }

  return classParts.join(' ')
})

const hasSearch = computed(
  () => !!(props.search && (props.filterPredicate || props.getSearchResults))
)
const isAsyncSearchMode = computed(() => hasSearch.value && props.getSearchResults)
const isDisabled = computed(
  () => props.disabled || (!props.items.length && !isAsyncSearchMode.value)
)

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

    let finalValue: typeof value.value
    if (props.multiple) {
      finalValue = newVal || []
    } else {
      const currentVal = value.value
      const isUnset =
        props.allowUnset &&
        currentVal &&
        newVal &&
        itemKey(currentVal as SingleItem) === itemKey(newVal as SingleItem)
      finalValue = isUnset ? undefined : newVal
    }

    if (props.fullyControlValue) {
      // Not setting value.value, cause then we don't give a chance for the parent
      // component to reject the update
      emit('update:modelValue', finalValue)
    } else {
      value.value = finalValue
    }

    // hacky, but there's no other way to force ListBox to re-read the modelValue prop which
    // we need in case the update was rejected and ListBox still thinks the value is the one
    // that was clicked on
    forceUpdateKey.value += 1
  }
})

const hasValueSelected = computed(() => {
  if (props.multiple && isArray(wrappedValue.value))
    return wrappedValue.value.length !== 0
  else return !!wrappedValue.value
})

const clearValue = () => {
  if (props.multiple) wrappedValue.value = []
  else wrappedValue.value = undefined
}

const finalItems = computed(() => {
  const searchVal = searchValue.value
  if (!hasSearch.value || !searchVal?.length) return currentItems.value

  if (props.filterPredicate) {
    return currentItems.value.filter(
      (i) => props.filterPredicate?.(i, searchVal) || false
    )
  }

  return currentItems.value
})

const listboxOptionsClasses = computed(() => {
  const classParts = [
    'rounded-md bg-foundation py-1 label label--light border border-outline-3 shadow-md mt-1 '
  ]

  if (props.mountMenuOnBody) {
    classParts.push('fixed z-50')
  } else {
    classParts.push('absolute top-[100%] w-full z-40')
  }

  return classParts.join(' ')
})

const listboxOptionsStyle = computed(() => {
  const style: CSSProperties = {}

  if (props.mountMenuOnBody) {
    const top = listboxButtonBounding.top.value
    const left = listboxButtonBounding.left.value
    const width = listboxButtonBounding.width.value
    const height = listboxButtonBounding.height.value

    style.top = `${top + height}px`
    style.left = `${left}px`
    style.width = `${width}px`
  }

  return style
})

const simpleDisplayText = (v: ValueType) => JSON.stringify(v)
const itemKey = (v: SingleItem): string | number => {
  if (isObjectLikeType(v)) {
    return v[props.by || 'id'] as string
  } else {
    return v
  }
}

const triggerSearch = async () => {
  if (!isAsyncSearchMode.value || !props.getSearchResults) return

  isAsyncLoading.value = true
  try {
    currentItems.value = await props.getSearchResults(searchValue.value)
  } finally {
    isAsyncLoading.value = false
  }
}
const debouncedSearch = debounce(triggerSearch, 1000)

const listboxOptionClasses = (params: { active: boolean; disabled: boolean }) => {
  const { disabled } = params || {}

  const classParts = ['relative transition select-none py-1 px-2']

  if (disabled) {
    classParts.push('opacity-50 cursor-not-allowed')
  } else {
    classParts.push('text-foreground cursor-pointer')
  }

  return classParts.join(' ')
}

watch(
  () => props.items,
  (newItems) => {
    currentItems.value = newItems.slice()
  },
  { immediate: true }
)

watch(searchValue, () => {
  if (!isAsyncSearchMode.value) return
  void debouncedSearch()
})

onMounted(() => {
  if (isAsyncSearchMode.value && !props.items.length) {
    void triggerSearch()
  }
})

defineExpose({ triggerSearch })
</script>

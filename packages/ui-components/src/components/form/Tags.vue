<template>
  <Combobox
    v-model="selectedItems"
    as="div"
    multiple
    clearable
    :class="[wrapperClasses]"
  >
    <FormTagsContextManager ref="ctxManager">
      <label :for="name" :class="labelClasses">
        <span>{{ title }}</span>
      </label>
      <div
        class="relative flex flex-wrap items-center space-x-1 px-2 py-1"
        :class="inputWrapperClasses"
      >
        <CommonBadge
          v-for="tag in selectedItems"
          :key="tag"
          :icon-left="!disabled ? XMarkIcon : undefined"
          clickable-icon
          size="lg"
          @click-icon="() => removeTag(tag)"
        >
          {{ tag }}
        </CommonBadge>
        <input
          ref="inputEl"
          v-model="query"
          :disabled="disabled"
          class="bg-transparent grow shrink border-0 focus:ring-0 p-0"
          :class="[coreInputClasses, sizeClasses]"
          style="flex-basis: 70px; min-width: 70px"
          :placeholder="!selectedItems.length ? placeholder : undefined"
          @input="onQueryInput"
          @keydown.escape="onQueryEscape"
          @keydown.enter="onQueryInput($event, true)"
          @keydown.tab="onQueryInput"
          @keydown.backspace="onQueryBackspace"
          @keydown.arrow-up="onQueryArrowUp"
          @keydown.arrow-down="onQueryArrowDown"
          @blur="isAutocompleteOpen = false"
        />
        <a
          v-if="showClear"
          title="Clear input"
          class="absolute top-2 right-0 flex items-center pr-2 cursor-pointer"
          @click="clear"
          @keydown="clear"
        >
          <span class="text-xs sr-only">Clear input</span>
          <XMarkIcon class="h-5 w-5 text-foreground" aria-hidden="true" />
        </a>
        <div
          v-if="errorMessage"
          :class="[
            'pointer-events-none absolute top-[10px] right-0 flex items-center',
            showClear ? 'pr-8' : 'pr-2'
          ]"
        >
          <ExclamationCircleIcon class="h-4 w-4 text-danger" aria-hidden="true" />
        </div>
        <div
          v-if="showRequired && !errorMessage"
          class="pointer-events-none absolute top-[2px] text-4xl right-0 flex items-center text-danger opacity-50"
          :class="showClear ? 'pr-8' : 'pr-2'"
        >
          *
        </div>
      </div>
      <TransitionRoot
        leave="transition ease-in duration-100"
        leave-from="opacity-100"
        leave-to="opacity-0"
        class="relative px-0.5"
      >
        <ComboboxOptions
          class="absolute top-1 max-h-60 w-full overflow-auto simple-scrollbar rounded-md bg-foundation-2 py-1 shadow label label--light outline outline-2 outline-primary-muted focus:outline-none"
        >
          <div v-if="isAutocompleteLoading" class="px-1">
            <CommonLoadingBar :loading="true" />
          </div>
          <div v-else-if="!autocompleteItems.length">
            <div class="text-foreground-2 text-center">
              Press
              <strong>Enter</strong>
              to create tag ⚡
            </div>
          </div>
          <template v-else>
            <ComboboxOption
              v-for="tag in autocompleteItems"
              :key="tag"
              v-slot="{ selected, active }"
              as="template"
              :value="tag"
            >
              <li
                class="relative cursor-default select-none py-2 pl-10 pr-4"
                :class="{
                  'bg-teal-600 text-white': active,
                  'text-gray-900': !active
                }"
              >
                <span
                  class="block truncate"
                  :class="{ 'font-medium': selected, 'font-normal': !selected }"
                >
                  {{ tag }}
                </span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-3"
                  :class="{ 'text-white': active, 'text-teal-600': !active }"
                >
                  <CheckIcon class="h-5 w-5" aria-hidden="true" />
                </span>
              </li>
            </ComboboxOption>
          </template>
        </ComboboxOptions>
      </TransitionRoot>
      <p v-if="helpTipId && !hideHelpTip" :id="helpTipId" :class="helpTipClasses">
        {{ helpTip }}
      </p>
    </FormTagsContextManager>
  </Combobox>
</template>

<script setup lang="ts">
import { ref, computed, toRefs, watch, onMounted } from 'vue'
import {
  Combobox,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot
} from '@headlessui/vue'
import { CheckIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/vue/20/solid'
import { debounce, uniq } from 'lodash'
import { InputColor, useTextInputCore } from '~~/src/composables/form/textInput'
import { RuleExpression } from 'vee-validate'
import { MaybeAsync, Nullable } from '@speckle/shared'
import CommonBadge from '~~/src/components/common/Badge.vue'
import FormTagsContextManager from '~~/src/components/form/tags/ContextManager.vue'
import { useFocus } from '@vueuse/core'
import CommonLoadingBar from '~~/src/components/common/loading/Bar.vue'

type InputSize = 'sm' | 'base' | 'lg' | 'xl'
type Tag = string
const isInputEvent = (e: Event): e is InputEvent => e.type === 'input'

const emit = defineEmits<{
  (e: 'change', val: { event?: Event; value: Tag[] }): void
  (e: 'clear'): void
}>()

const props = withDefaults(
  defineProps<{
    name: string
    help?: string
    label?: string
    showLabel?: boolean
    rules?: RuleExpression<Tag[]>
    validateOnMount?: boolean
    validateOnValueUpdate?: boolean
    autoFocus?: boolean
    showClear?: boolean
    showRequired?: boolean
    color?: InputColor
    wrapperClasses?: string
    size?: InputSize
    placeholder?: string
    disabled?: boolean
    useLabelInErrors?: boolean
    getAutocompleteItems?: (query: string) => MaybeAsync<Tag[]>
  }>(),
  {
    size: 'base',
    color: 'page',
    useLabelInErrors: true
  }
)

const model = defineModel<Tag[]>({ local: true })

const inputEl = ref(null as Nullable<HTMLInputElement>)
const { focused: isInputFocused } = useFocus(inputEl)

const ctxManager = ref(
  null as Nullable<{
    goUp: () => void
    goDown: () => void
    open: () => void
    close: () => void
    selectActive: () => void
    isOpen: () => boolean
  }>
)

const {
  coreInputClasses,
  coreClasses,
  labelClasses,
  title,
  helpTip,
  helpTipId,
  hideHelpTip,
  helpTipClasses,
  errorMessage,
  clear
} = useTextInputCore({
  props: toRefs(props),
  emit,
  inputEl
})

const autocompleteItems = ref([] as string[])
const isAutocompleteLoading = ref(false)

const isAutocompleteOpen = ref(false)
const query = ref('')

const selectedItems = computed({
  get: () => model.value || [],
  set: (newVal) => {
    model.value = uniq(newVal).filter((t) => !!t.length)
  }
})

// const filteredItems = computed(() =>
//   query.value === ''
//     ? serverTags.value
//     : serverTags.value.filter((tag) =>
//         tag
//           .toLowerCase()
//           .replace(/\s+/g, '')
//           .includes(query.value.toLowerCase().replace(/\s+/g, ''))
//       )
// )

const sizeClasses = computed((): string => {
  switch (props.size) {
    case 'sm':
      return 'h-6'
    case 'lg':
      return 'h-10'
    case 'xl':
      return 'h-14'
    case 'base':
    default:
      return 'h-8'
  }
})

const inputWrapperClasses = computed(() => {
  const classParts: string[] = [
    coreClasses.value,
    props.disabled
      ? 'cursor-not-allowed !bg-foundation-disabled !text-disabled-muted'
      : ''
  ]

  if (props.showClear && (errorMessage.value || props.showRequired)) {
    classParts.push('pr-14')
  } else if (props.showClear || errorMessage.value || props.showRequired) {
    classParts.push('pr-8')
  }

  if (errorMessage.value) {
    classParts.push('border-2 border-danger text-danger-darker')
    if (isInputFocused.value) {
      classParts.push('ring-1 ring-danger')
    }
  } else {
    classParts.push('border-2 border-transparent')
    if (isInputFocused.value) {
      classParts.push('ring-2 ring-outline-2')
    }
  }

  return classParts.join(' ')
})

const removeTag = (tag: Tag) => {
  if (props.disabled) return

  const idx = selectedItems.value.indexOf(tag)
  if (idx !== -1) {
    const newSelected = selectedItems.value.slice()
    newSelected.splice(idx, 1)

    selectedItems.value = newSelected
  }
}

const onQueryEscape = () => {
  inputEl.value?.blur()
  isAutocompleteOpen.value = false
}

const onQueryBackspace = (e: KeyboardEvent) => {
  if (e.key !== 'Backspace') return
  if (query.value.length) return

  // Clear last tag
  const newTags = selectedItems.value.slice()
  newTags.pop()
  selectedItems.value = newTags
  isAutocompleteOpen.value = false
}

const onQueryArrowUp = () => {
  if (ctxManager.value?.isOpen()) {
    ctxManager.value?.goUp()
  } else {
    ctxManager.value?.open()
  }
}

const onQueryArrowDown = () => {
  if (ctxManager.value?.isOpen()) {
    ctxManager.value?.goDown()
  } else {
    ctxManager.value?.open()
  }
}

const resolveAutocompleteItems = async () => {
  if (!props.getAutocompleteItems) return

  isAutocompleteLoading.value = true
  autocompleteItems.value = await Promise.resolve(
    props.getAutocompleteItems(query.value)
  )
  isAutocompleteLoading.value = false
}
const debouncedResolve = debounce(resolveAutocompleteItems, 1000)

const onQueryInput = (e: Event, forceCreateFromInput?: boolean) => {
  const isAddingTag = isInputEvent(e)
    ? e.data === ' ' || e.data === ',' || e.data === ';'
    : true

  if (isAddingTag) {
    let selected = false
    if (
      ctxManager.value?.isOpen() &&
      autocompleteItems.value.length &&
      !forceCreateFromInput
    ) {
      // Add from opened autocomplete panel
      ctxManager.value?.selectActive()
      selected = true
    } else {
      // Add from query
      const newTag = query.value
        .trim()
        .substring(0, query.value.length - (isInputEvent(e) ? 1 : 0))

      const tagExists = selectedItems.value.includes(newTag)
      if (newTag.length > 0 && !tagExists) {
        selectedItems.value = [...selectedItems.value, newTag]
        selected = true
      }
    }

    if (selected) {
      query.value = ''
      isAutocompleteOpen.value = false
    }
  } else {
    isAutocompleteOpen.value = !!query.value.length
  }
}

watch(isAutocompleteOpen, (newIsOpen, oldIsOpen) => {
  if (newIsOpen && !oldIsOpen) {
    if (props.getAutocompleteItems) ctxManager.value?.open()
  } else if (!newIsOpen && oldIsOpen) {
    ctxManager.value?.close()
  }
})

watch(query, () => {
  debouncedResolve()
})

onMounted(() => {
  resolveAutocompleteItems()
})

defineExpose({ resolveAutocompleteItems })
</script>

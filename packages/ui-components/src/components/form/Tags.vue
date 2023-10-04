<template>
  <Combobox
    v-model="selectedItems"
    as="div"
    multiple
    clearable
    :class="[fullWidth ? 'w-full relative' : '', wrapperClasses]"
  >
    <FormTagsContextManager ref="ctxManager">
      <label :for="name" :class="labelClasses">
        <span>{{ title }}</span>
      </label>
      <div class="relative flex items-center space-x-1" :class="[coreClasses, 'px-2']">
        <CommonBadge
          v-for="tag in selectedItems"
          :key="tag"
          :icon-left="XMarkIcon"
          clickable-icon
          size="lg"
          @click-icon="() => removeTag(tag)"
        >
          {{ tag }}
        </CommonBadge>
        <input
          ref="inputEl"
          v-model="query"
          class="bg-transparent grow border-0 focus:ring-0 p-0"
          :class="[coreInputClasses, sizeClasses]"
          @input="onQueryInput"
          @keydown.escape="onQueryEscape"
          @keydown.enter="onQueryInput"
          @keydown.tab="onQueryInput"
          @keydown.backspace="onQueryBackspace"
          @keydown.arrow-up="onQueryArrowUp"
          @keydown.arrow-down="onQueryArrowDown"
          @blur="isAutocompleteOpen = false"
        />
      </div>
      <TransitionRoot
        leave="transition ease-in duration-100"
        leave-from="opacity-100"
        leave-to="opacity-0"
        class="relative"
      >
        <ComboboxOptions
          class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
        >
          <div
            v-if="filteredTags.length === 0 && query !== ''"
            class="relative cursor-default select-none py-2 px-4 text-gray-700"
          >
            Create new tag!
          </div>

          <ComboboxOption
            v-for="tag in filteredTags"
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
        </ComboboxOptions>
      </TransitionRoot>
      <p v-if="helpTipId && !hideHelpTip" :id="helpTipId" :class="helpTipClasses">
        {{ helpTip }}
      </p>
    </FormTagsContextManager>
  </Combobox>
</template>

<script setup lang="ts">
import { ref, computed, toRefs, watch } from 'vue'
import {
  Combobox,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot
} from '@headlessui/vue'
import { CheckIcon, XMarkIcon } from '@heroicons/vue/20/solid'
import { uniq } from 'lodash'
import { InputColor, useTextInputCore } from '~~/src/composables/form/textInput'
import { RuleExpression } from 'vee-validate'
import { Nullable } from '@speckle/shared'
import CommonBadge from '~~/src/components/common/Badge.vue'
import FormTagsContextManager from '~~/src/components/form/tags/ContextManager.vue'

type InputSize = 'sm' | 'base' | 'lg' | 'xl'
type Tag = string
const isInputEvent = (e: Event): e is InputEvent => e.type === 'input'

const emit = defineEmits<{
  (e: 'update:modelValue', v: Tag[]): void
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
    modelValue?: Tag[]
    autoFocus?: boolean
    showClear?: boolean
    useLabelInErrors?: boolean
    hideErrorMessage?: boolean
    color?: InputColor
    fullWidth?: boolean
    wrapperClasses?: string
    size?: InputSize
  }>(),
  {
    size: 'base'
  }
)

const inputEl = ref(null as Nullable<HTMLInputElement>)
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
  helpTipClasses
} = useTextInputCore({
  props: toRefs(props),
  emit,
  inputEl
})

const serverTags = ref(['test1', 'test2', 'test3'])
const selectedInternal = ref([] as Tag[])
const isAutocompleteOpen = ref(false)
const query = ref('')

const selectedItems = computed({
  get: () => selectedInternal.value,
  set: (newVal) => {
    selectedInternal.value = uniq(newVal).filter((t) => !!t.length)
  }
})

const finalTagOptions = computed(() => {
  const tags = [...selectedItems.value, ...serverTags.value]
  return uniq(tags)
})

const filteredTags = computed(() =>
  query.value === ''
    ? finalTagOptions.value
    : finalTagOptions.value.filter((tag) =>
        tag
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.value.toLowerCase().replace(/\s+/g, ''))
      )
)

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

const removeTag = (tag: Tag) => {
  const idx = selectedItems.value.indexOf(tag)
  if (idx !== -1) {
    const newSelected = selectedItems.value.slice()
    newSelected.splice(idx, 1)

    selectedItems.value = newSelected
  }
}

// // unknown cuz headlessui components aren't generic
// const displayValue = (item: unknown) => {
//   // return ''

//   const typedItem = item as Tag
//   if (!typedItem?.length) return ''

//   return `${typedItem}`
// }

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

const onQueryInput = (e: Event) => {
  const isAddingTag = isInputEvent(e)
    ? e.data === ' ' || e.data === ',' || e.data === ';'
    : true

  if (isAddingTag) {
    // Add from opened autocomplete panel

    let selected = false
    if (ctxManager.value?.isOpen()) {
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
    ctxManager.value?.open()
  } else if (!newIsOpen && oldIsOpen) {
    ctxManager.value?.close()
  }
})
</script>

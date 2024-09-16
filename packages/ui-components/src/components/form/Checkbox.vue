<template>
  <div
    class="relative flex"
    :class="labelPosition === 'left' ? 'flex-row-reverse items-center' : 'items-start'"
  >
    <div
      class="flex h-6 items-center"
      :class="labelPosition === 'left' ? 'w-1/2 justify-end mr-2' : ''"
    >
      <input
        :id="finalId"
        :checked="coreChecked"
        :aria-describedby="descriptionId"
        :name="name"
        :disabled="disabled"
        :value="checkboxValue"
        type="checkbox"
        :class="checkboxClasses"
        v-bind="$attrs"
        @change="onChange"
      />
    </div>
    <div class="text-sm" :class="labelPosition === 'left' ? 'w-1/2' : 'ml-2'">
      <label :for="finalId" :class="{ 'sr-only': hideLabel }">
        <span class="text-body-xs text-foreground font-medium">{{ title }}</span>
        <span v-if="showRequired" class="text-danger ml-1">*</span>
        <p v-if="descriptionText" :id="descriptionId" :class="descriptionClasses">
          {{ descriptionText }}
        </p>
      </label>
    </div>
  </div>
</template>
<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { useField } from 'vee-validate'
import type { RuleExpression } from 'vee-validate'
import { computed, onMounted, ref } from 'vue'
import type { PropType } from 'vue'
import type { Optional } from '@speckle/shared'
import { nanoid } from 'nanoid'
import type { LabelPosition } from '~~/src/composables/form/input'

/**
 * Troubleshooting:
 * - If clicking on the checkbox doesn't do anything, check if any of its ancestor elements
 * have a @click.prevent on them anywhere.
 * - If you're not using the checkbox in a group, it's suggested that you set :value="true",
 * so that a v-model attached to the checkbox will be either 'true' or 'undefined' depending on the
 * checked state
 */

type ValueType = Optional<string | true> | string[]

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  /**
   * Input name/id. In a checkbox group, all checkboxes must have the same name and different values.
   */
  name: {
    type: String,
    required: true
  },
  /**
   * Whether the input is disabled
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * Set label text
   */
  label: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  /**
   * Help text
   */
  description: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  /**
   * Whether to inline the help description
   */
  inlineDescription: {
    type: Boolean,
    default: false
  },
  /**
   * vee-validate validation rules
   */
  rules: {
    type: [String, Object, Function, Array] as PropType<RuleExpression<ValueType>>,
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
   * Whether to show the red "required" asterisk
   */
  showRequired: {
    type: Boolean,
    default: false
  },
  /**
   * Checkbox group's value
   */
  modelValue: {
    type: [String, Boolean] as PropType<ValueType | false>,
    default: undefined
  },
  /**
   * Checkbox's own value. If it is checked, modelValue will include this value (amongst any other checked values from the same group).
   * If not set will default to 'name' value.
   */
  value: {
    type: [String, Boolean] as PropType<Optional<string | true>>,
    default: true
  },
  /**
   * HTML ID to use, must be globally unique. If not specified, a random ID will be generated. One is necessary to properly associate the label and checkbox.
   */
  id: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  hideLabel: {
    type: Boolean,
    default: false
  },
  labelPosition: {
    type: String as PropType<LabelPosition>,
    default: 'top'
  }
})

const generateRandomId = (prefix: string) => `${prefix}-${nanoid()}`

defineEmits<{
  (e: 'update:modelValue', val: ValueType): void
}>()

const checkboxValue = computed(() => props.value || props.name)

const {
  checked: coreChecked,
  errorMessage,
  handleChange,
  value: coreValue
} = useField<ValueType>(props.name, props.rules, {
  validateOnMount: props.validateOnMount,
  type: 'checkbox',
  checkedValue: checkboxValue,
  initialValue: props.modelValue || undefined
})

const title = computed(() => props.label || props.name)

const descriptionText = computed(() => props.description || errorMessage.value)
const descriptionId = computed(() => `${props.name}-description`)
const descriptionClasses = computed((): string => {
  const classParts: string[] = ['text-body-2xs']

  if (props.inlineDescription) {
    classParts.push('inline ml-2')
  } else {
    classParts.push('block')
  }

  if (errorMessage.value) {
    classParts.push('text-danger')
  } else {
    classParts.push('text-foreground-2')
  }

  return classParts.join(' ')
})

const implicitId = ref<Optional<string>>(generateRandomId('checkbox'))
const finalId = computed(() => props.id || implicitId.value)

const checkboxClasses = computed(() => {
  const classParts = [
    'h-3.5 w-3.5 rounded',
    'border bg-foundation text-primary',
    'hover:border-foreground-2 focus:ring-1 focus:ring-outline-4 focus:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-60'
  ]

  if (errorMessage.value) {
    classParts.push('border-danger-lighter')
  } else {
    classParts.push('border-outline-5')
  }

  return classParts.join(' ')
})

const onChange = (e: unknown) => {
  if (props.disabled) return
  handleChange(e)
}

/**
 * Bugfix for strange issue where checkbox appears checked even tho it shouldnt be.
 * It's not clear why this happens, but for some reason coreValue.value shows that the checkbox
 * is checked, even tho props.modelValue is undefined.
 */
onMounted(() => {
  const newModelValue = props.modelValue
  const newCoreValue = coreValue.value

  const shouldBeChecked = Array.isArray(newModelValue)
    ? newModelValue.includes(props.value as any)
    : newModelValue === props.value

  const isCoreChecked = Array.isArray(newCoreValue)
    ? newCoreValue.includes(props.value as any)
    : newCoreValue === props.value

  if (shouldBeChecked !== isCoreChecked) {
    handleChange(newModelValue)
  }
})
</script>

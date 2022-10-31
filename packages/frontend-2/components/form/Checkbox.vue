<template>
  <div class="relative flex items-start">
    <div class="flex h-6 items-center">
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
      <input
        :checked="finalChecked"
        :aria-describedby="descriptionId"
        :name="name"
        :value="value"
        :disabled="disabled"
        type="checkbox"
        class="h-4 w-4 rounded text-primary focus:ring-primary-lighter disabled:cursor-not-allowed disabled:bg-background-2 disabled:text-foreground-3"
        :class="computedClasses"
        v-bind="$attrs"
        @change="onChange"
      />
    </div>
    <div class="ml-2 text-sm" style="padding-top: 3px">
      <label :for="name" class="font-medium text-foreground-2">
        <span>{{ title }}</span>
        <span v-if="showRequired" class="text-danger ml-1">*</span>
      </label>
      <p v-if="descriptionText" :id="descriptionId" :class="descriptionClasses">
        {{ descriptionText }}
      </p>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  inheritAttrs: false
})
</script>
<script setup lang="ts">
import { RuleExpression, useField } from 'vee-validate'
import { PropType } from 'vue'
import { Optional } from '@speckle/shared'

type ValueType = Optional<string> | string[]

const props = defineProps({
  /**
   * Input "type" value (changes behaviour & look). In a checkbox group, all checkboxes must have the same name and different values.
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
    type: String as PropType<ValueType>,
    default: undefined
  },
  /**
   * Checkbox's own string value. If it is checked, modelValue will include this value (amongst any other checked values from the same group)
   */
  value: {
    type: String as PropType<string>,
    required: true
  }
})

defineEmits<{
  (e: 'update:modelValue', val: ValueType): void
}>()

const {
  checked: finalChecked,
  errorMessage,
  handleChange
} = useField<ValueType>(props.name, props.rules, {
  validateOnMount: props.validateOnMount,
  type: 'checkbox',
  checkedValue: props.value
})

const onChange = (e: unknown) => {
  if (props.disabled) return
  handleChange(e)
}

const title = computed(() => props.label || props.name)

const computedClasses = computed((): string => {
  return errorMessage.value ? 'border-danger-lighter' : 'border-foreground-4 '
})

const descriptionText = computed(() => props.description || errorMessage.value)
const descriptionId = computed(() => `${props.name}-description`)
const descriptionClasses = computed((): string => {
  const classParts: string[] = []

  if (props.inlineDescription) {
    classParts.push('inline ml-2')
  } else {
    classParts.push('block')
  }

  if (errorMessage.value) {
    classParts.push('text-danger')
  } else {
    classParts.push('text-foreground-3')
  }

  return classParts.join(' ')
})
</script>

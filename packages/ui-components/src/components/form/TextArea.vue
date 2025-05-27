<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div :class="computedWrapperClasses">
    <div
      :class="
        labelPosition === 'left'
          ? 'w-full md:w-6/12 flex flex-col justify-center'
          : 'w-full'
      "
    >
      <label :for="name" :class="labelClasses">
        <span>{{ title }}</span>
        <div v-if="!showRequired" class="text-body-2xs font-normal">(optional)</div>
      </label>
      <span
        v-if="labelPosition === 'left' && helpTipIdLeft"
        :id="helpTipIdLeft"
        :class="helpTipClasses"
      >
        {{ helpTip }}
      </span>
    </div>
    <div
      class="relative"
      :class="labelPosition === 'left' ? 'w-full md:w-6/12' : 'w-full'"
    >
      <textarea
        :id="name"
        ref="inputElement"
        v-model="value"
        :name="name"
        :class="[
          coreClasses,
          iconClasses,
          sizeClasses,
          textareaClasses || '',
          'min-h-[6rem] sm:min-h-[3rem] simple-scrollbar'
        ]"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="errorMessage ? 'true' : 'false'"
        :aria-describedby="labelPosition === 'left' ? helpTipIdLeft : helpTipIdTop"
        v-bind="$attrs"
        @change="$emit('change', { event: $event, value })"
        @input="$emit('input', { event: $event, value })"
        @keydown.stop
      />
      <a
        v-if="shouldShowClear"
        title="Clear input"
        class="absolute top-2 right-0 flex items-center pr-2 cursor-pointer"
        @click="clear"
        @keydown="clear"
      >
        <span class="text-xs sr-only">Clear input</span>
        <XMarkIcon class="h-5 w-5 text-foreground" aria-hidden="true" />
      </a>
    </div>
    <p
      v-if="labelPosition === 'top' && helpTipIdTop"
      :id="helpTipIdTop"
      :class="['mt-1.5', helpTipClasses]"
    >
      {{ helpTip }}
    </p>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid'
import type { Nullable } from '@speckle/shared'
import type { RuleExpression } from 'vee-validate'
import { computed, ref, toRefs } from 'vue'
import type { LabelPosition } from '~~/src/composables/form/input'
import type { InputColor } from '~~/src/composables/form/textInput'
import { useTextInputCore } from '~~/src/composables/form/textInput'

type InputSize = 'sm' | 'base' | 'lg' | 'xl'

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'change', val: { event?: Event; value: string }): void
  (e: 'input', val: { event?: Event; value: string }): void
  (e: 'clear'): void
}>()

const props = withDefaults(
  defineProps<{
    /**
     * Unique ID for the input (must be unique page-wide)
     */
    name: string
    showLabel?: boolean
    help?: string
    placeholder?: string
    label?: string
    disabled?: boolean
    rules?: RuleExpression<string>
    validateOnMount?: boolean
    validateOnValueUpdate?: boolean
    useLabelInErrors?: boolean
    autoFocus?: boolean
    modelValue?: string
    showClear?: boolean
    fullWidth?: boolean
    showRequired?: boolean
    showOptional?: boolean
    color?: InputColor
    textareaClasses?: string
    size?: InputSize
    labelPosition?: LabelPosition
    wrapperClasses?: string
  }>(),
  {
    useLabelInErrors: true,
    modelValue: '',
    color: 'page',
    labelPosition: 'top',
    wrapperClasses: ''
  }
)

const inputElement = ref(null as Nullable<HTMLTextAreaElement>)

const {
  coreClasses,
  title,
  value,
  helpTipClasses,
  helpTip,
  errorMessage,
  labelClasses,
  clear,
  focus,
  shouldShowClear
} = useTextInputCore({
  props: toRefs(props),
  emit,
  inputEl: inputElement
})

const helpTipIdTop = computed(() => `${props.name}-help-top`)
const helpTipIdLeft = computed(() => `${props.name}-help-left`)

const iconClasses = computed(() => {
  const classParts: string[] = ['pl-2']

  if (shouldShowClear.value && errorMessage.value) {
    classParts.push('pr-12')
  } else if (shouldShowClear.value || errorMessage.value) {
    classParts.push('pr-8')
  }

  return classParts.join(' ')
})

const sizeClasses = computed((): string => {
  switch (props.size) {
    case 'sm':
      return 'text-body sm:text-body-2xs'
    case 'lg':
      return 'text-body sm:text-sm'
    case 'xl':
      return 'text-body sm:text-base'
    case 'base':
    default:
      return 'text-body sm:text-body-xs'
  }
})

const computedWrapperClasses = computed(() => {
  const classes = ['flex', props.wrapperClasses]
  if (props.fullWidth) {
    classes.push('w-full')
  }

  if (props.labelPosition === 'top') {
    classes.push('flex-col')
  }
  if (props.labelPosition === 'left') {
    classes.push(
      'w-full space-y-1 sm:space-y-0 sm:space-x-8 flex-col sm:flex-row items-start'
    )
  }
  return classes.join(' ')
})

defineExpose({ focus })
</script>

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
        <div v-if="showRequired" class="text-danger text-body-xs opacity-80">*</div>
        <div v-else-if="showOptional" class="text-body-2xs font-normal">(optional)</div>
      </label>
      <p
        v-if="labelPosition === 'left' && helpTipId && !hideHelpTip"
        :id="helpTipId"
        :class="helpTipClasses"
      >
        {{ helpTip }}
      </p>
    </div>

    <div
      class="group relative"
      :class="labelPosition === 'left' ? 'w-full md:w-6/12' : 'w-full'"
    >
      <div
        v-if="customIcon"
        class="pointer-events-none absolute top-0 bottom-0 left-0 flex items-center pl-2"
      >
        <Component
          :is="customIcon"
          v-if="customIcon"
          :class="leadingIconClasses"
          aria-hidden="true"
        />
      </div>
      <div
        v-if="loading"
        class="absolute top-0 h-full right-0 flex items-center pr-2 text-foreground-3"
      >
        <CommonLoadingIcon />
      </div>

      <input
        :id="name"
        ref="inputElement"
        v-model="value"
        :type="type"
        :name="name"
        :class="[coreClasses, iconClasses, sizeClasses, inputClasses || '']"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="errorMessage ? 'true' : 'false'"
        :aria-describedby="helpTipId"
        :readonly="readOnly"
        role="textbox"
        v-bind="$attrs"
        @change="$emit('change', { event: $event, value })"
        @input="$emit('input', { event: $event, value })"
        @focus="$emit('focus')"
        @blur="$emit('blur')"
      />
      <slot name="input-right">
        <a
          v-if="rightIcon"
          :title="rightIconTitle"
          :class="[
            sizeClasses,
            readOnly
              ? 'w-full cursor-text border border-transparent group-hover:border-outline-5 rounded-md'
              : 'cursor-pointer'
          ]"
          class="absolute top-0 right-0 hidden group-hover:flex items-center justify-end pr-1 text-foreground-2"
          @click="onRightIconClick"
          @keydown="onRightIconClick"
        >
          <span class="text-body-xs sr-only">{{ rightIconTitle }}</span>
          <Component
            :is="rightIcon"
            class="h-6 w-6 text-foreground"
            aria-hidden="true"
          />
        </a>
        <a
          v-else-if="shouldShowClear"
          title="Clear input"
          class="absolute top-0 bottom-0 right-0 flex items-center pr-2 cursor-pointer"
          @click="clear"
          @keydown="clear"
        >
          <span class="text-body-xs sr-only">Clear input</span>
          <XMarkIcon class="h-5 w-5 text-foreground" aria-hidden="true" />
        </a>
        <div
          v-else-if="!showLabel && showRequired && !errorMessage"
          class="pointer-events-none absolute top-0 bottom-0 mt-2 text-body right-0 flex items-center text-danger pr-2.5"
          :class="[shouldShowClear ? 'pr-8' : 'pr-2']"
        >
          *
        </div>
      </slot>
    </div>
    <p
      v-if="labelPosition === 'top' && helpTipId && !hideHelpTip"
      :id="helpTipId"
      :class="['mt-1.5', helpTipClasses]"
    >
      {{ helpTip }}
    </p>
  </div>
</template>
<script setup lang="ts">
import type { RuleExpression } from 'vee-validate'
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { computed, ref, toRefs, useSlots } from 'vue'
import type { PropType } from 'vue'
import type { Nullable, Optional } from '@speckle/shared'
import { useTextInputCore } from '~~/src/composables/form/textInput'
import type { PropAnyComponent } from '~~/src/helpers/common/components'
import type { InputColor } from '~~/src/composables/form/textInput'
import type { LabelPosition } from '~~/src/composables/form/input'
import { CommonLoadingIcon } from '~~/src/lib'

type InputType = 'text' | 'email' | 'password' | 'url' | 'search' | 'number' | string
type InputSize = 'sm' | 'base' | 'lg' | 'xl'

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  /**
   * Input "type" value (changes behaviour & look)
   */
  type: {
    type: String as PropType<InputType>,
    default: 'text'
  },
  /**
   * Unique ID for the input (must be unique page-wide)
   */
  name: {
    type: String,
    required: true
  },
  /**
   * Whether to show label (label will always be shown to screen readers)
   */
  showLabel: {
    type: Boolean,
    required: false
  },
  /**
   * Optional help text
   */
  help: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  /**
   * Placeholder text
   */
  placeholder: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  /**
   * Set label text explicitly
   */
  label: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  /**
   * Whether to show the red "required" asterisk
   */
  showRequired: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to show the "optional" text
   */
  showOptional: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to disable the component, blocking it from user input
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to disable editing the component, making it read only
   */
  readOnly: {
    type: Boolean,
    default: false
  },
  /**
   * vee-validate validation rules
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
   * Set a custom icon to use inside the input
   */
  customIcon: {
    type: [Object, Function] as PropType<Optional<PropAnyComponent>>,
    default: undefined
  },
  /**
   * Whether to focus on the input when component is mounted
   */
  autoFocus: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: String,
    default: ''
  },
  size: {
    type: String as PropType<InputSize>,
    default: 'base'
  },
  showClear: {
    type: Boolean,
    default: false
  },
  inputClasses: {
    type: String,
    default: null
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  hideErrorMessage: {
    type: Boolean,
    default: false
  },
  customErrorMessage: {
    type: String,
    default: null
  },
  wrapperClasses: {
    type: String,
    default: () => ''
  },
  color: {
    type: String as PropType<InputColor>,
    default: 'page'
  },
  labelPosition: {
    type: String as PropType<LabelPosition>,
    default: 'top'
  },
  rightIcon: {
    type: [Object, Function] as PropType<Optional<PropAnyComponent>>,
    default: undefined
  },
  rightIconTitle: {
    type: String,
    default: undefined
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'change', val: { event?: Event; value: string }): void
  (e: 'input', val: { event?: Event; value: string }): void
  (e: 'clear'): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'rightIconClick'): void
}>()

const slots = useSlots()

const inputElement = ref(null as Nullable<HTMLInputElement>)

const {
  coreClasses,
  title,
  value,
  helpTipId,
  helpTipClasses,
  helpTip,
  hideHelpTip,
  errorMessage,
  clear,
  focus,
  labelClasses,
  shouldShowClear
} = useTextInputCore({
  props: toRefs(props),
  emit,
  inputEl: inputElement
})

const leadingIconClasses = computed(() => {
  const classParts: string[] = ['h-4 w-4']

  if (errorMessage.value) {
    classParts.push('text-danger')
  } else {
    classParts.push('text-foreground-2')
  }

  return classParts.join(' ')
})

const iconClasses = computed((): string => {
  const classParts: string[] = []

  if (props.customIcon) {
    classParts.push('pl-8')
  } else {
    classParts.push('pl-2')
  }

  if (!slots['input-right']) {
    if (props.rightIcon || errorMessage.value || shouldShowClear.value) {
      classParts.push('pr-8')
    }
  }

  return classParts.join(' ')
})

const sizeClasses = computed((): string => {
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

const computedWrapperClasses = computed(() => {
  const classes = ['flex', props.wrapperClasses]
  if (props.fullWidth) {
    classes.push('w-full')
  }

  if (props.labelPosition === 'top') {
    classes.push('flex-col')
  }
  if (props.labelPosition === 'left') {
    classes.push('w-full space-y-1 sm:space-y-0 sm:space-x-8 flex-col sm:flex-row')
  }
  return classes.join(' ')
})

const onRightIconClick = () => {
  emit('rightIconClick')
}

defineExpose({ focus })
</script>

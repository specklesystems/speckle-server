<template>
  <div :class="[fullWidth ? 'w-full' : '']">
    <label
      :for="name"
      class="block label text-foreground"
      :class="{ 'sr-only': !showLabel }"
    >
      <span>{{ title }}</span>
    </label>
    <div class="relative">
      <div
        v-if="hasLeadingIcon"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
      >
        <Component
          :is="customIcon"
          v-if="customIcon"
          :class="leadingIconClasses"
          aria-hidden="true"
        />
        <EnvelopeIcon
          v-else-if="type === 'email'"
          :class="leadingIconClasses"
          aria-hidden="true"
        />
        <KeyIcon
          v-else-if="type === 'password'"
          :class="leadingIconClasses"
          aria-hidden="true"
        />
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
        role="textbox"
        v-bind="$attrs"
        @focusin="textInputGlobalFocus = true"
        @focusout="textInputGlobalFocus = false"
        @change="$emit('change', { event: $event, value })"
        @input="$emit('input', { event: $event, value })"
      />
      <slot name="input-right">
        <a
          v-if="showClear"
          title="Clear input"
          class="absolute inset-y-0 right-0 flex items-center pr-2 cursor-pointer"
          @click="clear"
          @keydown="clear"
        >
          <span class="text-xs sr-only">Clear input</span>
          <XMarkIcon class="h-5 w-5 text-foreground" aria-hidden="true" />
        </a>
        <div
          v-if="errorMessage"
          :class="[
            'pointer-events-none absolute inset-y-0 right-0 flex items-center',
            showClear ? 'pr-8' : 'pr-2'
          ]"
        >
          <ExclamationCircleIcon class="h-4 w-4 text-danger" aria-hidden="true" />
        </div>
        <div
          v-if="showRequired && !errorMessage"
          class="pointer-events-none absolute inset-y-0 mt-3 text-4xl right-0 flex items-center pr-2 text-danger opacity-50"
        >
          *
        </div>
      </slot>
    </div>
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
<script lang="ts">
import { defineComponent } from 'vue'
import { useTextInputCore } from '~~/lib/form/composables/textInput'
export default defineComponent({
  inheritAttrs: false
})
</script>
<script setup lang="ts">
import { RuleExpression } from 'vee-validate'
import {
  ExclamationCircleIcon,
  EnvelopeIcon,
  KeyIcon,
  XMarkIcon
} from '@heroicons/vue/20/solid'
import { ConcreteComponent, PropType } from 'vue'
import { Nullable, Optional } from '@speckle/shared'
import { useTextInputGlobalFocus } from '~~/composables/states'

type InputType = 'text' | 'email' | 'password' | 'url' | 'search'
type InputSize = 'sm' | 'base' | 'lg' | 'xl'

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
   * Whether to disable the component, blocking it from user input
   */
  disabled: {
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
    type: [Object, Function] as PropType<Optional<ConcreteComponent>>,
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
  fullWidth: {
    type: Boolean,
    default: false
  },
  inputClasses: {
    type: String,
    default: null
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'change', val: { event?: Event; value: string }): void
  (e: 'input', val: { event?: Event; value: string }): void
  (e: 'clear'): void
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
  errorMessage,
  clear,
  focus
} = useTextInputCore({
  props: toRefs(props),
  emit,
  inputEl: inputElement
})

const textInputGlobalFocus = useTextInputGlobalFocus()

const leadingIconClasses = computed(() => {
  const classParts: string[] = ['h-5 w-5']

  if (errorMessage.value) {
    classParts.push('text-danger')
  } else {
    classParts.push('text-foreground-2')
  }

  return classParts.join(' ')
})

const hasLeadingIcon = computed(
  () => ['email', 'password'].includes(props.type) || props.customIcon
)

const iconClasses = computed((): string => {
  const classParts: string[] = []

  if (hasLeadingIcon.value) {
    classParts.push('pl-10')
  }

  if (!slots['input-right']) {
    if (errorMessage.value || props.showClear) {
      if (errorMessage.value && props.showClear) {
        classParts.push('pr-12')
      } else {
        classParts.push('pr-8')
      }
    }
  }

  return classParts.join(' ')
})

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

defineExpose({ focus })
</script>

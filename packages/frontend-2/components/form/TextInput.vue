<template>
  <div>
    <label :for="name" class="block label" :class="{ 'sr-only': !showLabel }">
      <span>{{ title }}</span>
    </label>
    <div class="relative mt-1 rounded-md">
      <div
        v-if="hasLeadingIcon"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2"
      >
        <EnvelopeIcon
          v-if="type === 'email'"
          :class="leadingIconClasses"
          aria-hidden="true"
        />
        <LockClosedIcon
          v-if="type === 'password'"
          :class="leadingIconClasses"
          aria-hidden="true"
        />
      </div>
      <input
        :id="name"
        v-model="value"
        :type="type"
        :name="name"
        :class="[
          'block h-12 w-full rounded-xl focus:outline-none sm:text-sm bg-foundation-page text-foreground transition-all',
          'disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-muted',
          computedClasses
        ]"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="helpTipId"
        role="textbox"
        v-bind="$attrs"
      />
      <div
        v-if="error"
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
      >
        <ExclamationCircleIcon class="h-4 w-4 text-danger" aria-hidden="true" />
      </div>
      <div
        v-if="showRequired && !error"
        class="pointer-events-none absolute inset-y-0 mt-3 text-4xl right-0 flex items-center pr-2 text-danger opacity-50"
      >
        *
      </div>
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
export default defineComponent({
  inheritAttrs: false
})
</script>
<script setup lang="ts">
import { RuleExpression, useField } from 'vee-validate'
import {
  ExclamationCircleIcon,
  EnvelopeIcon,
  LockClosedIcon
} from '@heroicons/vue/20/solid'
import { PropType } from 'vue'
import { Optional } from '@speckle/shared'
import { ChangeEvent } from 'rollup'

type InputType = 'text' | 'email' | 'password' | 'url' | 'search'

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
  modelValue: {
    type: String,
    default: ''
  }
})

defineEmits<{ (e: 'update:modelValue', val: ChangeEvent): void }>()

const { value, errorMessage: error } = useField(props.name, props.rules, {
  validateOnMount: props.validateOnMount,
  initialValue: props.modelValue || undefined
})

const leadingIconClasses = ref('h-4 w-4 text-foreground-2')

const hasLeadingIcon = computed(() => ['email', 'password'].includes(props.type))

const computedClasses = computed((): string => {
  const classParts: string[] = []

  if (hasLeadingIcon.value) {
    classParts.push('pl-8')
  }

  if (error.value) {
    classParts.push(
      'pr-8 border-danger-lighter text-danger-darker placeholder-danger-lighter focus:border-danger focus:ring-danger'
    )
  } else {
    classParts.push('border-0 focus:ring-2 focus:ring-primary-muted')
  }

  return classParts.join(' ')
})

const title = computed(() => props.label || props.name)

const helpTip = computed(() => error.value || props.help)
const hasHelpTip = computed(() => !!helpTip.value)
const helpTipId = computed(() => (hasHelpTip.value ? `${props.name}-help` : undefined))
const helpTipClasses = computed((): string =>
  error.value ? 'text-danger' : 'text-foreground-2'
)
</script>

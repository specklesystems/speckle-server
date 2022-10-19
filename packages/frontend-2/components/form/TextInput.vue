<template>
  <div>
    <label :for="name" class="block text-foreground-2 label">
      <span>{{ title }}</span>
      <span v-if="showRequired" class="text-danger ml-1">*</span>
    </label>
    <div class="relative mt-1 rounded-md shadow-sm">
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
          'block w-full shadow-sm rounded-md focus:outline-none sm:text-sm text-black',
          'disabled:cursor-not-allowed  disabled:bg-background-2 disabled:text-foreground-3',
          computedClasses
        ]"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="helpTipId"
      />
      <div
        v-if="error"
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
      >
        <ExclamationCircleIcon class="h-4 w-4 text-danger" aria-hidden="true" />
      </div>
    </div>
    <p v-if="helpTipId" :id="helpTipId" class="mt-2 text-sm" :class="helpTipClasses">
      {{ helpTip }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { RuleExpression, useField } from 'vee-validate'
import {
  ExclamationCircleIcon,
  EnvelopeIcon,
  LockClosedIcon
} from '@heroicons/vue/20/solid'
import { PropType } from 'vue'
import { Optional } from '@speckle/shared'

type InputType = 'text' | 'email' | 'password' | 'url' | 'search'

const props = defineProps({
  type: {
    type: String as PropType<InputType>,
    default: 'text'
  },
  name: {
    type: String,
    required: true
  },
  help: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  placeholder: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  label: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  showRequired: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  rules: {
    type: [String, Object, Function, Array] as PropType<RuleExpression<string>>,
    default: undefined
  },
  validateOnMount: {
    type: Boolean,
    default: false
  }
})

const { value, errorMessage: error } = useField(props.name, props.rules, {
  validateOnMount: props.validateOnMount
})

const leadingIconClasses = ref('h-4 w-4 text-foreground-3')

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
    classParts.push('border-foreground-4 focus:border-primary focus:ring-primary')
  }

  return classParts.join(' ')
})

const title = computed(() => props.label || props.name)

const helpTip = computed(() => props.help || error.value)
const hasHelpTip = computed(() => !!helpTip.value)
const helpTipId = computed(() => (hasHelpTip.value ? `${props.name}-help` : undefined))
const helpTipClasses = computed((): string =>
  error.value ? 'text-danger' : 'text-foreground-3'
)
</script>

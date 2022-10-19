<template>
  <div class="relative flex items-start">
    <div class="flex h-6 items-center">
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
      <input
        :id="name"
        v-model="value"
        :aria-describedby="descriptionId"
        :name="name"
        type="checkbox"
        class="h-4 w-4 rounded text-primary focus:ring-primary-lighter"
        :class="computedClasses"
      />
    </div>
    <div class="ml-2 text-sm">
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
<script setup lang="ts">
import { RuleExpression, useField } from 'vee-validate'
import { PropType } from 'vue'
import { Optional } from '@speckle/shared'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  label: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  description: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  inlineDescription: {
    type: Boolean,
    default: false
  },
  rules: {
    type: [String, Object, Function, Array] as PropType<RuleExpression<boolean>>,
    default: undefined
  },
  validateOnMount: {
    type: Boolean,
    default: false
  },
  showRequired: {
    type: Boolean,
    default: false
  }
})

const { value, errorMessage } = useField<boolean>(props.name, props.rules, {
  validateOnMount: props.validateOnMount
})

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

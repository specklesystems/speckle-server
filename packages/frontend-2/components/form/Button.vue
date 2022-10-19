<template>
  <Component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="buttonType"
    :external="external"
    :class="[
      'inline-flex items-center rounded-md border border-transparent font-medium shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-offset-2',
      computedClasses
    ]"
    :disabled="disabled"
    @click="onClick"
  >
    <slot>Submit</slot>
  </Component>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { Optional } from '@speckle/shared'

type FormButtonSize = 'big' | 'normal' | 'small'
type FormButtonType = 'primary' | 'secondary' | 'danger' | 'outline'

const emit = defineEmits<{ (e: 'click', val: MouseEvent): void }>()

const props = defineProps({
  to: {
    type: String as PropType<Optional<string>>,
    required: false,
    default: undefined
  },
  size: {
    type: String as PropType<FormButtonSize>,
    default: 'normal'
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  type: {
    type: String as PropType<FormButtonType>,
    default: 'primary'
  },
  external: {
    type: Boolean as PropType<Optional<boolean>>,
    required: false,
    default: undefined
  },
  disabled: {
    type: Boolean as PropType<Optional<boolean>>,
    required: false,
    default: undefined
  },
  submit: {
    type: Boolean,
    default: false
  }
})

const NuxtLink = resolveComponent('NuxtLink')

const buttonType = computed(() => {
  if (props.to) return undefined
  if (props.submit) return 'submit'
  return 'button'
})

const colorClasses = computed(() => {
  const isDisabled = props.disabled
  switch (props.type) {
    case 'outline':
      return `${
        isDisabled ? 'text-foreground-3' : 'text-foreground'
      } bg-transparent border-foreground-3 focus:ring-primary-lighter`
    case 'danger':
      return `${
        isDisabled ? 'bg-danger-darker' : 'bg-danger'
      } text-white hover:bg-danger-darker focus:ring-danger-lighter`
    case 'secondary':
      return `${
        isDisabled ? 'bg-secondary-darker' : 'bg-secondary'
      } text-white hover:bg-secondary-darker focus:ring-secondary-lighter`
    default:
    case 'primary':
      return `${
        isDisabled ? 'bg-primary-darker' : 'bg-primary'
      } text-white hover:bg-primary-darker focus:ring-primary-lighter`
  }
})
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'px-2 py-1 text-xs'
    case 'big':
      return 'px-6 py-4 text-base'
    default:
    case 'normal':
      return 'px-4 py-2 text-sm'
  }
})
const computedClasses = computed(() => {
  const classParts: string[] = []

  if (props.fullWidth) {
    classParts.push('w-full justify-center')
  }

  if (props.disabled) {
    classParts.push('cursor-not-allowed')
  }

  classParts.push(colorClasses.value)
  classParts.push(sizeClasses.value)

  return classParts.join(' ')
})

const onClick = (e: MouseEvent) => {
  if (props.disabled) {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    return
  }

  emit('click', e)
}
</script>

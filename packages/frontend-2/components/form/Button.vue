<template>
  <Component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="buttonType"
    :external="external"
    :class="[
      'inline-flex items-center rounded-xl focus:outline-none hover:ring-4 focus:ring-4 transition',
      computedClasses
    ]"
    :disabled="disabled"
    role="button"
    @click="onClick"
  >
    <slot>Submit</slot>
  </Component>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { Optional } from '@speckle/shared'

type FormButtonSize = 'big' | 'normal' | 'small'
type FormButtonType =
  | 'primary'
  | 'pop'
  | 'secondary'
  | 'danger'
  | 'outline'
  | 'success'
  | 'warning'
  | 'invert'

const emit = defineEmits<{
  /**
   * Emit MouseEvent on click
   */
  (e: 'click', val: MouseEvent): void
}>()

const props = defineProps({
  /**
   * URL to which to navigate - can be a relative (app) path or an absolute link for an external URL
   */
  to: {
    type: String as PropType<Optional<string>>,
    required: false,
    default: undefined
  },
  /**
   * Choose from one of many button sizes
   */
  size: {
    type: String as PropType<FormButtonSize>,
    default: 'normal'
  },
  /**
   * If set, will make the button take up all available space horizontally
   */
  fullWidth: {
    type: Boolean,
    default: false
  },
  /**
   * Choose semantic color of the button
   */
  type: {
    type: String as PropType<FormButtonType>,
    default: 'primary'
  },
  /**
   * Whether the target location should be forcefully treated as an external URL
   * (for relative paths this will likely cause a redirect)
   */
  external: {
    type: Boolean as PropType<Optional<boolean>>,
    required: false,
    default: undefined
  },
  /**
   * Whether to disable the button so that it can't be pressed
   */
  disabled: {
    type: Boolean as PropType<Optional<boolean>>,
    required: false,
    default: undefined
  },
  /**
   * If set, will have type set to "submit" to enable it to submit any parent forms
   */
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
  const disabledClasses = 'bg-disabled text-disabled-muted focus:ring-0 hover:ring-0'

  switch (props.type) {
    case 'outline':
      return `${
        isDisabled ? disabledClasses : 'text-primary'
      } border-2 border-primary ring-primary-muted`
    case 'danger':
      return `${
        isDisabled ? disabledClasses : 'bg-danger'
      } text-white hover:bg-danger-darker ring-danger-lighter`
    case 'warning':
      return `${
        isDisabled ? disabledClasses : 'bg-warning'
      } text-white hover:bg-warning-darker ring-warning-lighter`
    case 'pop':
      return `${
        isDisabled ? disabledClasses : 'bg-primary'
      } text-white hover:bg-primary-focus `
    case 'invert':
      return `${
        isDisabled ? disabledClasses : 'bg-white/95 text-primary'
      } hover:bg-white ring-white/50`
    default:
    case 'primary':
      return `${
        isDisabled
          ? disabledClasses
          : 'bg-primary-muted text-primary hover:bg-primary hover:text-white'
      }`
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'px-2 py-1 text-xs rounded-lg'
    case 'big':
      return 'px-6 py-4'
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

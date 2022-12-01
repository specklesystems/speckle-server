<template>
  <Component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="buttonType"
    :external="external"
    :class="buttonClasses"
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

type FormButtonSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl'
type FormButtonType = 'standard' | 'pill' | 'outline' | 'link'

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
    default: 'base'
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
    default: 'standard'
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
  },
  /**
   * Use foreground color variation of the link button
   */
  foregroundLink: {
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

const typeClasses = computed(() => {
  const classParts: string[] = []

  const disabled = props.disabled

  // const isXs = props.size === 'xs'
  // const isSm = props.size === 'sm'
  const isXl = props.size === 'xl'
  // const isBase = props.size === 'base'

  // Rounded borders
  if (['pill', 'outline'].includes(props.type)) {
    classParts.push(isXl ? 'rounded-4xl' : 'rounded-3xl')
  } else {
    classParts.push('rounded')
  }

  if (['outline', 'link'].includes(props.type)) {
    // bg
    classParts.push('bg-inherit')

    // text
    if (disabled) {
      classParts.push('text-foreground-disabled')
    } else {
      classParts.push(
        props.foregroundLink
          ? 'text-foreground'
          : 'text-primary hover:text-primary-focus focus:text-primary-focus'
      )
    }
  } else {
    // bg
    classParts.push(
      disabled
        ? 'bg-primary-muted'
        : 'bg-primary hover:bg-primary-focus focus:bg-primary-focus'
    )
    // text
    classParts.push(
      disabled ? 'text-foreground-disabled' : 'text-foreground-on-primary'
    )
  }

  // Rings
  if (props.type !== 'link') {
    // const ringClass = isXs ? 'hover:ring-1' : isBase || isSm ? 'hover:ring-2' : 'ring'
    const ringClass = 'ring-4'
    if (props.type === 'outline') {
      classParts.push(
        disabled
          ? `border-2 border-foreground-disabled`
          : `border-2 border-primary hover:${ringClass}`
      )
    } else if (!disabled) {
      classParts.push('ring-primary-outline-2')

      classParts.push(`focus:${ringClass} hover:${ringClass}`)
    }
  }

  return classParts.join(' ')
})

const sizeClasses = computed(() => {
  const classParts: string[] = []

  // weight
  if (props.size === 'xl') {
    classParts.push('font-medium')
  } else {
    classParts.push('font-semibold')
  }

  // font size
  if (['base', 'lg'].includes(props.size)) {
    classParts.push('text-base leading-5')
  } else if (props.size === 'xl') {
    classParts.push('text-lg leading-7')
  } else if (props.size === 'sm') {
    classParts.push('text-sm leading-5')
  } else if (props.size === 'xs') {
    classParts.push('text-xs leading-4')
  }

  // padding
  if (props.type !== 'link') {
    switch (props.size) {
      case 'xs':
        classParts.push('px-2 py-1')
        break
      case 'sm':
        classParts.push('p-2')
        break
      case 'xl':
        classParts.push('px-5 py-4')
        break
      case 'lg':
        classParts.push('px-4 py-3')
        break
      case 'base':
      default:
        classParts.push('px-3 py-2')
        break
    }
  }

  return classParts.join(' ')
})

const generalClasses = computed(() => {
  const classParts: string[] = []

  if (props.fullWidth) {
    classParts.push('w-full')
  }

  if (props.disabled) {
    classParts.push('cursor-not-allowed')
  }

  return classParts.join(' ')
})

const buttonClasses = computed(() =>
  [
    'transition inline-flex justify-center items-center outline-none',
    generalClasses.value,
    typeClasses.value,
    sizeClasses.value
  ].join(' ')
)

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

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
    <div ref="iconleft" class="mr-2 -ml-1 icon-slot">
      <slot name="iconleft"></slot>
    </div>
    <div ref="content">
      <slot>Submit</slot>
    </div>
    <div ref="icon" class="ml-2 icon-slot">
      <slot name="icon"></slot>
    </div>
  </Component>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { Optional } from '@speckle/shared'

type FormButtonSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl'
type FormButtonColor = 'default' | 'invert' | 'danger' | 'warning'

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
   * Will outline the button.
   */
  outlined: {
    type: Boolean,
    default: false
  },
  /**
   * Will apply a rounded class.
   */
  rounded: {
    type: Boolean,
    default: false
  },
  /**
   * Will remove background.
   */
  text: {
    type: Boolean,
    default: false
  },
  /**
   * Will remove paddings and background. Use for links.
   */
  link: {
    type: Boolean,
    default: false
  },
  /**
   * Colors:
   * default: the default primary blue.
   * invert: for when you want to use this button on a primary background.
   * danger: for dangerous actions (e.g. deletions).
   * warning: for less dangerous actions (e.g. archival).
   */
  color: {
    type: String as PropType<FormButtonColor>,
    default: 'default'
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

const icon = ref<HTMLElement | null>(null)
const iconleft = ref<HTMLElement | null>(null)

const buttonType = computed(() => {
  if (props.to) return undefined
  if (props.submit) return 'submit'
  return 'button'
})

const bgAndBorderClasses = computed(() => {
  const classParts: string[] = []

  classParts.push('border-2')
  if (props.disabled) {
    classParts.push(
      props.outlined
        ? 'border-foreground-disabled'
        : 'bg-foundation-disabled border-transparent'
    )
  } else {
    switch (props.color) {
      case 'invert':
        classParts.push(
          props.outlined
            ? 'border-foundation dark:border-foreground'
            : 'bg-foundation dark:bg-foreground border-transparent'
        )
        break
      case 'danger':
        classParts.push(props.outlined ? 'border-danger' : 'bg-danger border-danger')
        break
      case 'warning':
        classParts.push(props.outlined ? 'border-warning' : 'bg-warning border-warning')
        break
      case 'default':
      default:
        classParts.push(
          props.outlined
            ? 'border-primary hover:border-primary-focus'
            : 'bg-primary hover:bg-primary-focus border-transparent'
        )
        break
    }
  }

  return classParts.join(' ')
})

const foregroundClasses = computed(() => {
  const classParts: string[] = []
  if (!props.text && !props.link) {
    if (props.disabled) {
      classParts.push(
        props.outlined ? 'text-foreground-disabled' : 'text-foreground-disabled'
      )
    } else {
      switch (props.color) {
        case 'invert':
          classParts.push(
            props.outlined ? 'text-foundation dark:text-foreground' : 'text-primary'
          )
          break
        case 'danger':
          classParts.push(
            props.outlined ? 'text-danger' : 'text-foundation dark:text-foreground'
          )
          break
        case 'warning':
          classParts.push(
            props.outlined ? 'text-warning' : 'text-foundation dark:text-foreground'
          )
          break
        case 'default':
        default:
          classParts.push(
            props.outlined
              ? 'text-primary hover:text-primary-focus'
              : 'text-foundation dark:text-foreground'
          )
          break
      }
    }
  } else {
    classParts.push(
      props.disabled
        ? 'text-foreground-disabled'
        : props.color === 'invert'
        ? 'text-foundation hover:text-foundation-2 dark:text-foreground dark:hover:text-foreground-2'
        : 'text-primary hover:text-primary-focus'
    )
  }
  return classParts.join(' ')
})

const roundedClasses = computed(() => {
  const classParts: string[] = []
  classParts.push(props.rounded ? 'rounded-full' : 'rounded-md')
  return classParts.join(' ')
})

const ringClasses = computed(() => {
  const classParts: string[] = []
  if (!props.disabled) {
    switch (props.color) {
      case 'invert':
        classParts.push('hover:ring-4 ring-white/50')
        break
      case 'danger':
        classParts.push('hover:ring-4 ring-danger-lighter dark:ring-danger-darker')
        break
      case 'warning':
        classParts.push('hover:ring-4 ring-warning-lighter dark:ring-warning-darker')
        break
      case 'default':
      default:
        classParts.push('hover:ring-4')
        break
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
    classParts.push(props.size === 'xs' ? '' : 'font-semibold')
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
  if (!props.link) {
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

const decoratorClasses = computed(() => {
  const classParts: string[] = []
  if (!props.disabled && (!props.link || !props.text)) {
    classParts.push('active:scale-[0.95]')
  }

  if (!props.disabled && (props.link || props.text)) {
    classParts.push(
      'underline decoration-transparent decoration-2 underline-offset-4	hover:decoration-inherit'
    )
  }

  return classParts.join(' ')
})

const buttonClasses = computed(() => {
  const isLinkOrText = props.link || props.text
  return [
    'transition inline-flex justify-center items-center outline-none select-none',
    generalClasses.value,
    sizeClasses.value,
    foregroundClasses.value,
    isLinkOrText ? '' : bgAndBorderClasses.value,
    isLinkOrText ? '' : roundedClasses.value,
    isLinkOrText ? '' : ringClasses.value,
    decoratorClasses.value
  ].join(' ')
})

onMounted(() => {
  const setIconSize = (icon: SVGElement) => {
    switch (props.size) {
      case 'xs':
        icon.classList.add('w-3')
        icon.classList.add('h-3')
        break
      case 'sm':
        icon.classList.add('w-4')
        icon.classList.add('h-4')
        break
      case 'xl':
        icon.classList.add('w-8')
        icon.classList.add('h-8')
        break
      case 'lg':
        icon.classList.add('w-6')
        icon.classList.add('h-6')
        break
      case 'base':
      default:
        icon.classList.add('w-5')
        icon.classList.add('h-5')
        break
    }
  }

  for (const child of (icon.value as HTMLElement).children) {
    setIconSize(child as SVGElement)
  }
  for (const child of (iconleft.value as HTMLElement).children) {
    setIconSize(child as SVGElement)
  }
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
<style scoped>
.icon-slot:empty {
  display: none;
}
</style>

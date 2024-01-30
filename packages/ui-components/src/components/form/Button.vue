<template>
  <Component
    :is="to ? linkComponent : 'button'"
    :href="to"
    :to="to"
    :type="buttonType"
    :external="external"
    :class="buttonClasses"
    :disabled="isDisabled"
    role="button"
    @click="onClick"
  >
    <Component
      :is="finalLeftIcon"
      v-if="finalLeftIcon"
      :class="`${iconClasses} ${hideText ? '' : 'mr-2'}`"
    />
    <slot v-if="!hideText">Button</slot>
    <Component
      :is="iconRight"
      v-if="iconRight || !loading"
      :class="`${iconClasses} ${hideText ? '' : 'ml-2'}`"
    />
  </Component>
</template>
<script setup lang="ts">
import { isObjectLike } from 'lodash'
import type { PropType } from 'vue'
import type { PropAnyComponent } from '~~/src/helpers/common/components'
import { computed, resolveDynamicComponent } from 'vue'
import type { Nullable, Optional } from '@speckle/shared'
import { ArrowPathIcon } from '@heroicons/vue/24/solid'

type FormButtonSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl'
type FormButtonColor =
  | 'default'
  | 'invert'
  | 'danger'
  | 'warning'
  | 'success'
  | 'card'
  | 'secondary'
  | 'info'

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
   * Similar to "link", but without an underline and possibly in different colors
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
   * Add icon to the left from the text
   */
  iconLeft: {
    type: [Object, Function] as PropType<Nullable<PropAnyComponent>>,
    default: null
  },
  /**
   * Add icon to the right from the text
   */
  iconRight: {
    type: [Object, Function] as PropType<Nullable<PropAnyComponent>>,
    default: null
  },
  /**
   * Hide default slot (when you want to show icons only)
   */
  hideText: {
    type: Boolean,
    default: false
  },
  /**
   * Customize component to be used when rendering links.
   *
   * The component will try to dynamically resolve NuxtLink and RouterLink and use those, if this is set to null.
   */
  linkComponent: {
    type: [Object, Function] as PropType<Nullable<PropAnyComponent>>,
    default: null
  },
  /**
   * Disables the button and shows a spinning loader
   */
  loading: {
    type: Boolean,
    default: false
  }
})

const NuxtLink = resolveDynamicComponent('NuxtLink')
const RouterLink = resolveDynamicComponent('RouterLink')

const linkComponent = computed(() => {
  if (props.linkComponent) return props.linkComponent
  if (props.external) return 'a'
  if (isObjectLike(NuxtLink)) return NuxtLink
  if (isObjectLike(RouterLink)) return RouterLink
  return 'a'
})

const buttonType = computed(() => {
  if (props.to) return undefined
  if (props.submit) return 'submit'
  return 'button'
})

const isDisabled = computed(() => props.disabled || props.loading)
const finalLeftIcon = computed(() => (props.loading ? ArrowPathIcon : props.iconLeft))

const bgAndBorderClasses = computed(() => {
  const classParts: string[] = []

  classParts.push('border-2')
  if (isDisabled.value) {
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
      case 'card':
        classParts.push(
          props.outlined
            ? 'border-foundation-2 shadow'
            : 'bg-foundation-2 dark:bg-foundation-2 border-foundation shadow'
        )
        break
      case 'danger':
        classParts.push(props.outlined ? 'border-danger' : 'bg-danger border-danger')
        break
      case 'secondary':
        classParts.push(
          props.outlined ? 'border-foundation' : 'bg-foundation border-foundation-2'
        )
        break
      case 'warning':
        classParts.push(props.outlined ? 'border-warning' : 'bg-warning border-warning')
        break
      case 'info':
        classParts.push(props.outlined ? 'border-info' : 'bg-info border-info')
        break
      case 'success':
        classParts.push(props.outlined ? 'border-success' : 'bg-success border-success')
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
    if (isDisabled.value) {
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
        case 'card':
          classParts.push(props.outlined ? 'text-foreground' : 'text-foreground')
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
        case 'info':
          classParts.push(
            props.outlined ? 'text-info' : 'text-foundation dark:text-foreground'
          )
          break
        case 'success':
          classParts.push(
            props.outlined ? 'text-success' : 'text-foundation dark:text-foreground'
          )
          break
        case 'secondary':
          classParts.push(
            props.outlined
              ? 'text-foreground hover:text-primary'
              : 'text-foreground hover:text-primary'
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
    if (isDisabled.value) {
      classParts.push('text-foreground-disabled')
    } else {
      if (props.color === 'invert') {
        classParts.push(
          'text-foundation hover:text-foundation-2 dark:text-foreground dark:hover:text-foreground'
        )
      } else if (props.color === 'secondary') {
        classParts.push('text-foreground-2 hover:text-primary-focus')
      } else if (props.color === 'success') {
        classParts.push('text-success')
      } else if (props.color === 'warning') {
        classParts.push('text-warning')
      } else if (props.color === 'info') {
        classParts.push('text-info')
      } else if (props.color === 'danger') {
        classParts.push('text-danger')
      } else {
        classParts.push('text-primary hover:text-primary-focus')
      }
    }
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
  if (!isDisabled.value) {
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
      case 'info':
        classParts.push('hover:ring-4 ring-info-lighter dark:ring-info-darker')
        break
      case 'success':
        classParts.push('hover:ring-4 ring-success-lighter dark:ring-success-darker')
        break
      case 'default':
      default:
        classParts.push('hover:ring-2')
        break
    }
  }
  return classParts.join(' ')
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-5 text-xs font-medium xxx-tracking-wide'
    case 'sm':
      return 'h-6 text-sm font-medium xxx-tracking-wide'
    case 'lg':
      return 'h-10 text-lg font-semibold xxx-tracking-wide'
    case 'xl':
      return 'h-14 text-xl font-bold xxx-tracking-wide'
    default:
    case 'base':
      return 'h-8 text-sm sm:text-base font-medium xxx-tracking-wide'
  }
})

const paddingClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'px-1'
    case 'sm':
      return 'px-2'
    case 'lg':
      return 'px-4'
    case 'xl':
      return 'px-5'
    default:
    case 'base':
      return 'px-3'
  }
})

const generalClasses = computed(() => {
  const classParts: string[] = []

  if (props.fullWidth) {
    classParts.push('w-full')
  }

  if (isDisabled.value) {
    classParts.push('cursor-not-allowed')
  }

  return classParts.join(' ')
})

const decoratorClasses = computed(() => {
  const classParts: string[] = []
  if (!isDisabled.value && !props.link && !props.text) {
    classParts.push('active:scale-[0.97]')
  }

  if (!isDisabled.value && props.link) {
    classParts.push(
      'underline decoration-transparent decoration-2 underline-offset-4	hover:decoration-inherit'
    )
  }

  return classParts.join(' ')
})

const buttonClasses = computed(() => {
  const isLinkOrText = props.link || props.text
  return [
    'transition inline-flex justify-center text-center items-center outline-none select-none leading-[0.9rem]',
    generalClasses.value,
    sizeClasses.value,
    foregroundClasses.value,
    isLinkOrText ? '' : bgAndBorderClasses.value,
    isLinkOrText ? '' : roundedClasses.value,
    isLinkOrText ? '' : ringClasses.value,
    props.link ? '' : paddingClasses.value,
    decoratorClasses.value
  ].join(' ')
})

const iconClasses = computed(() => {
  const classParts: string[] = ['']

  if (props.loading) {
    classParts.push('animate-spin')
  }

  switch (props.size) {
    case 'xs':
      classParts.push('h-3 w-3')
      break
    case 'sm':
      classParts.push('h-4 w-4')
      break
    case 'lg':
      classParts.push('h-6 w-6')
      break
    case 'xl':
      classParts.push('h-8 w-8')
      break
    case 'base':
    default:
      classParts.push('h-5 w-5')
      break
  }

  return classParts.join(' ')
})

const onClick = (e: MouseEvent) => {
  if (isDisabled.value) {
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

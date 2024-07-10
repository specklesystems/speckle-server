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
    <Component :is="finalLeftIcon" v-if="finalLeftIcon" :class="iconClasses" />
    <slot v-if="!hideText">Button</slot>
    <Component :is="iconRight" v-if="iconRight || !loading" :class="iconClasses" />
  </Component>
</template>
<script setup lang="ts">
import { isObjectLike } from 'lodash'
import type { PropType } from 'vue'
import type { PropAnyComponent } from '~~/src/helpers/common/components'
import { computed, resolveDynamicComponent } from 'vue'
import type { Nullable, Optional } from '@speckle/shared'
import { ArrowPathIcon } from '@heroicons/vue/24/solid'
import type { FormButtonStyle, FormButtonSize } from '~~/src/helpers/form/button'

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
   * Choose from one of 3 button sizes
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
   * Variant:
   * primary: the default primary blue.
   * outline: foundation background and outline
   * subtle: no styling
   */
  variant: {
    type: String as PropType<FormButtonStyle>,
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
  const classParts: string[] = ['border']

  switch (props.variant) {
    case 'subtle':
      classParts.push(
        'bg-transparent border-transparent text-foreground',
        'hover:bg-primary-muted focus-visible:border-foundation'
      )
      break
    case 'outline':
      classParts.push(
        'bg-foundation border-outline-2 text-foreground',
        'hover:bg-primary-muted focus-visible:border-foundation'
      )
      break
    case 'danger':
      classParts.push(
        'bg-danger border-danger-darker text-foundation',
        'hover:bg-danger-darker focus-visible:border-foundation'
      )
      break
    case 'primary':
    default:
      classParts.push(
        'bg-primary border-outline-1 text-foreground-on-primary',
        'hover:bg-primary-focus focus-visible:border-foundation'
      )
      break
  }

  return classParts.join(' ')
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'text-xs leading-4'
    case 'large':
      return 'text-sm leading-6'
    default:
    case 'base':
      return 'text-[13px] leading-6'
  }
})

const paddingClasses = computed(() => {
  if (props.hideText && (props.iconLeft || props.iconRight)) {
    switch (props.size) {
      case 'small':
        return 'p-1'
      case 'large':
        return 'p-2'
      default:
      case 'base':
        return 'p-1'
    }
  }

  if (!props.text) {
    switch (props.size) {
      case 'small':
        return 'px-2 py-1'
      case 'large':
        return 'px-6 py-2'
      default:
      case 'base':
        return 'px-4 py-1'
    }
  } else return 'p-0'
})

const generalClasses = computed(() => {
  const classParts: string[] = [
    'flex justify-center items-center',
    'font-semibold text-center select-none',
    'rounded-[5px] outline outline-2 outline-transparent',
    'transition duration-200 ease-in-out focus-visible:outline-outline-4'
  ]

  if (props.fullWidth) {
    classParts.push('w-full')
  } else {
    classParts.push('max-w-max')
  }

  if (isDisabled.value) {
    classParts.push('cursor-not-allowed')
  }

  return classParts.join(' ')
})

const buttonClasses = computed(() => {
  const isLinkOrText = props.link || props.text
  return [
    generalClasses.value,
    sizeClasses.value,
    isLinkOrText ? '' : bgAndBorderClasses.value,
    props.link ? '' : paddingClasses.value
  ].join(' ')
})

const iconClasses = computed(() => {
  const classParts: string[] = ['shrink-0']

  if (props.loading) {
    classParts.push('animate-spin')
  }

  switch (props.size) {
    case 'small':
      classParts.push('h-4 w-4 p-0.5')
      break
    case 'large':
      classParts.push('h-6 w-6 p-1')
      break
    case 'base':
    default:
      classParts.push('h-6 w-6 p-1')
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

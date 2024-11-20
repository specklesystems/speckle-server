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
    :style="
      color !== 'subtle' && !text
        ? `box-shadow: -1px 1px 4px 0px #0000000a inset; box-shadow: 0px 2px 2px 0px #0000000d;`
        : ''
    "
    @click="onClick"
  >
    <Component :is="finalLeftIcon" v-if="finalLeftIcon" :class="iconClasses" />
    <slot v-if="!hideText">Button</slot>
    <Component :is="iconRight" v-if="iconRight || !loading" :class="iconClasses" />
  </Component>
</template>
<script setup lang="ts">
import { isObjectLike } from 'lodash'
import type { PropAnyComponent } from '~~/src/helpers/common/components'
import { computed, resolveDynamicComponent } from 'vue'
import type { Nullable } from '@speckle/shared'
import type { FormButtonStyle, FormButtonSize } from '~~/src/helpers/form/button'
import { CommonLoadingIcon } from '~~/src/lib'

const emit = defineEmits<{
  /**
   * Emit MouseEvent on click
   */
  (e: 'click', val: MouseEvent): void
}>()

const props = defineProps<{
  /**
   * URL to which to navigate - can be a relative (app) path or an absolute link for an external URL
   */
  to?: string
  /**
   * Choose from one of 3 button sizes
   */
  size?: FormButtonSize
  /**
   * If set, will make the button take up all available space horizontally
   */
  fullWidth?: boolean
  /**
   * Similar to "link", but without an underline and possibly in different colors
   */
  text?: boolean
  /**
   * Will remove paddings and background. Use for links.
   */
  link?: boolean
  /**
   * color:
   * primary: the default primary blue.
   * outline: foundation background and outline
   * subtle: no styling
   */
  color?: FormButtonStyle
  /**
   * Should rounded-full be added?:
   */
  rounded?: boolean
  /**
   * Whether the target location should be forcefully treated as an external URL
   * (for relative paths this will likely cause a redirect)
   */
  external?: boolean
  /**
   * Whether to disable the button so that it can't be pressed
   */
  disabled?: boolean
  /**
   * If set, will have type set to "submit" to enable it to submit any parent forms
   */
  submit?: boolean
  /**
   * Add icon to the left from the text
   */
  iconLeft?: Nullable<PropAnyComponent>
  /**
   * Add icon to the right from the text
   */
  iconRight?: Nullable<PropAnyComponent>
  /**
   * Hide default slot (when you want to show icons only)
   */
  hideText?: boolean
  /**
   * Customize component to be used when rendering links.
   *
   * The component will try to dynamically resolve NuxtLink and RouterLink and use those, if this is set to null.
   */
  linkComponent?: Nullable<PropAnyComponent>
  /**
   * Disables the button and shows a spinning loader
   */
  loading?: boolean
}>()

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
const finalLeftIcon = computed(() =>
  props.loading ? CommonLoadingIcon : props.iconLeft
)

const bgAndBorderClasses = computed(() => {
  const classParts: string[] = []

  const colorsBgBorder = {
    subtle: [
      'bg-transparent border-transparent text-foreground font-medium',
      'hover:bg-primary-muted disabled:hover:bg-transparent focus-visible:border-foundation'
    ],
    outline: [
      'bg-foundation border-outline-2 text-foreground font-medium',
      'hover:bg-primary-muted disabled:hover:bg-foundation focus-visible:border-foundation'
    ],
    danger: [
      'bg-danger border-danger-darker text-foundation font-medium',
      'hover:bg-danger-darker disabled:hover:bg-danger focus-visible:border-foundation'
    ],
    primary: [
      'bg-primary border-outline-1 text-foreground-on-primary font-semibold',
      'hover:bg-primary-focus disabled:hover:bg-primary focus-visible:border-foundation'
    ]
  }

  if (props.rounded) {
    classParts.push('!rounded-full')
  }

  if (props.text || props.link) {
    switch (props.color) {
      case 'subtle':
        classParts.push('text-foreground')
        break
      case 'outline':
        classParts.push('text-foreground')
        break
      case 'danger':
        classParts.push('text-danger')
        break
      case 'primary':
      default:
        classParts.push('text-primary')
        break
    }
  } else {
    switch (props.color) {
      case 'subtle':
        classParts.push(...colorsBgBorder.subtle)
        break
      case 'outline':
        classParts.push(...colorsBgBorder.outline)
        break
      case 'danger':
        classParts.push(...colorsBgBorder.danger)
        break
      case 'primary':
      default:
        classParts.push(...colorsBgBorder.primary)
        break
    }
  }

  return classParts.join(' ')
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-6 text-body-2xs'
    case 'lg':
      return 'h-10 text-body-sm'
    default:
    case 'base':
      return 'h-8 text-body-xs'
  }
})

const paddingClasses = computed(() => {
  if (props.text || props.link) {
    return 'p-0'
  }

  const hasIconLeft = !!props.iconLeft
  const hasIconRight = !!props.iconRight
  const hideText = props.hideText

  switch (props.size) {
    case 'sm':
      if (hideText) return 'w-6'
      if (hasIconLeft) return 'py-1 pr-2 pl-1'
      if (hasIconRight) return 'py-1 pl-2 pr-1'
      return 'px-2 py-1'
    case 'lg':
      if (hideText) return 'w-10'
      if (hasIconLeft) return 'py-2 pr-6 pl-4'
      if (hasIconRight) return 'py-2 pl-6 pr-4'
      return 'px-6 py-2'
    case 'base':
    default:
      if (hideText) return 'w-8'
      if (hasIconLeft) return 'py-1 pr-4 pl-2'
      if (hasIconRight) return 'py-1 pl-4 pr-2'
      return 'px-4 py-1'
  }
})

const generalClasses = computed(() => {
  const baseClasses = [
    'inline-flex justify-center items-center',
    'text-center select-none whitespace-nowrap',
    'outline outline-2 outline-transparent',
    'transition duration-200 ease-in-out focus-visible:outline-outline-4'
  ]

  const additionalClasses = []

  if (!props.text && !props.link) {
    additionalClasses.push('rounded-md border')
  }

  if (props.fullWidth) {
    additionalClasses.push('w-full')
  } else if (!props.hideText) {
    additionalClasses.push('max-w-max')
  }
  if (isDisabled.value) {
    additionalClasses.push('cursor-not-allowed opacity-60')
  }

  return [...baseClasses, ...additionalClasses].join(' ')
})

const buttonClasses = computed(() => {
  return [
    generalClasses.value,
    sizeClasses.value,
    bgAndBorderClasses.value,
    paddingClasses.value
  ].join(' ')
})

const iconClasses = computed(() => {
  const classParts: string[] = ['shrink-0']

  switch (props.size) {
    case 'sm':
      classParts.push('h-5 w-5 p-0.5')
      break
    case 'lg':
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

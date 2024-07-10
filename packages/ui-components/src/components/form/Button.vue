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
import type { PropAnyComponent } from '~~/src/helpers/common/components'
import { computed, resolveDynamicComponent } from 'vue'
import type { Nullable } from '@speckle/shared'
import { ArrowPathIcon } from '@heroicons/vue/24/solid'
import type { FormButtonStyle, FormButtonSize } from '~~/src/helpers/form/button'

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
   * Variant:
   * primary: the default primary blue.
   * outline: foundation background and outline
   * subtle: no styling
   */
  variant: FormButtonStyle
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
const finalLeftIcon = computed(() => (props.loading ? ArrowPathIcon : props.iconLeft))

const bgAndBorderClasses = computed(() => {
  const classParts: string[] = []

  const variantsText = {
    subtle: 'text-foreground',
    outline: 'text-foreground',
    danger: 'text-danger',
    primary: 'text-primary'
  }

  const variantsBgBorder = {
    subtle: [
      'bg-transparent border-transparent text-foreground',
      'hover:bg-primary-muted focus-visible:border-foundation'
    ],
    outline: [
      'bg-foundation border-outline-2 text-foreground',
      'hover:bg-primary-muted focus-visible:border-foundation'
    ],
    danger: [
      'bg-danger border-danger-darker text-foundation',
      'hover:bg-danger-darker focus-visible:border-foundation'
    ],
    primary: [
      'bg-primary border-outline-1 text-foreground-on-primary',
      'hover:bg-primary-focus focus-visible:border-foundation'
    ]
  }

  if (props.text) {
    classParts.push(variantsText[props.variant] || variantsText.primary)
  } else {
    const variantClasses = variantsBgBorder[props.variant] || variantsBgBorder.primary
    classParts.push(...variantClasses)
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
  const hasIconLeft = !!props.iconLeft
  const hasIconRight = !!props.iconRight
  const hideText = props.hideText

  switch (props.size) {
    case 'small':
      if (hideText) return 'p-1'
      if (hasIconLeft) return 'py-1 pr-2 pl-1'
      if (hasIconRight) return 'py-1 pl-2 pr-1'
      return 'px-2 py-1'
    case 'large':
      if (hideText) return 'p-2'
      if (hasIconLeft) return 'py-2 pr-6 pl-4'
      if (hasIconRight) return 'py-2 pl-6 pr-4'
      return 'px-6 py-2'
    case 'base':
    default:
      if (hideText) return 'p-1'
      if (hasIconLeft) return 'py-1 pr-4 pl-2'
      if (hasIconRight) return 'py-1 pl-4 pr-2'
      return 'px-4 py-1'
  }
})

const generalClasses = computed(() => {
  const baseClasses = [
    'flex justify-center items-center',
    'font-semibold text-center select-none',
    'outline outline-2 outline-transparent',
    'transition duration-200 ease-in-out focus-visible:outline-outline-4'
  ]

  const additionalClasses = []

  if (!props.text) {
    additionalClasses.push('rounded-[5px] border')
  }

  if (props.fullWidth) {
    additionalClasses.push('w-full')
  } else {
    additionalClasses.push('max-w-max')
  }
  if (isDisabled.value) {
    additionalClasses.push('cursor-not-allowed')
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

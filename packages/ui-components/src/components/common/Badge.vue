<template>
  <span :class="badgeClasses">
    <svg v-if="dot" :class="dotClasses" fill="currentColor" viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="3" />
    </svg>
    <span class="whitespace-nowrap">
      <slot>Badge</slot>
    </span>
    <button v-if="iconLeft" :class="iconClasses" @click="onIconClick($event)">
      <Component :is="iconLeft" :class="['h-4 w-4', badgeDotIconColorClasses]" />
    </button>
  </span>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { PropAnyComponent } from '~~/src/helpers/common/components'

type BadgeSize = 'base' | 'lg'

const emit = defineEmits<{
  (e: 'click-icon', v: MouseEvent): void
}>()

const props = defineProps<{
  size?: BadgeSize
  /**
   * Set text & bg color. Defaults to primary variation.
   */
  colorClasses?: string

  /**
   * Show dot to the right
   */
  dot?: boolean

  /**
   * Set dot/icon bg color. Defaults to primary variation.
   */
  dotIconColorClasses?: string

  /**
   * Optionally show icon to the left of the text
   */
  iconLeft?: PropAnyComponent

  /**
   * A more square, but still rounded look
   */
  rounded?: boolean

  /**
   * Track icon clicks
   */
  clickableIcon?: boolean
}>()

const badgeColorClasses = computed(
  () => props.colorClasses || 'bg-info-lighter text-outline-4'
)

const badgeDotIconColorClasses = computed(
  () => props.dotIconColorClasses || 'text-blue-400'
)

const badgeClasses = computed(() => {
  const classParts: string[] = [
    'inline-flex items-center select-none',
    badgeColorClasses.value,
    props.size === 'lg'
      ? 'px-3 py-0.5 text-body-2xs'
      : 'p-1 text-body-3xs text-body-3xs font-medium'
  ]

  if (props.rounded) {
    classParts.push('rounded')
    classParts.push(
      props.size === 'lg'
        ? 'px-2 py-0.5 text-body-2xs'
        : 'px-1.1 py-0.5 text-body-3xs font-medium'
    )
  } else {
    classParts.push('rounded-full')
    classParts.push(
      props.size === 'lg'
        ? 'px-2.5 py-0.5 text-body-2xs'
        : 'px-2.5 py-0.5 text-body-3xs font-medium'
    )
  }

  return classParts.join(' ')
})

const iconClasses = computed(() => {
  const classParts: string[] = [
    'mt-0.5 ml-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full focus:outline-none'
  ]

  if (props.clickableIcon) {
    classParts.push('cursor-pointer')
  } else {
    classParts.push('cursor-default')
  }

  return classParts.join(' ')
})

const dotClasses = computed(() => {
  const classParts: string[] = [
    '-ml-0.5 mr-1.5 h-2 w-2',
    badgeDotIconColorClasses.value
  ]

  return classParts.join(' ')
})

const onIconClick = (e: MouseEvent) => {
  if (!props.clickableIcon) {
    e.stopPropagation()
    e.stopImmediatePropagation()
    e.preventDefault()
    return
  }

  emit('click-icon', e)
}
</script>

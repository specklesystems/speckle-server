<template>
  <span :class="badgeClasses">
    <svg v-if="dot" :class="dotClasses" fill="currentColor" viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="3" />
    </svg>
    <slot>Badge</slot>
    <NuxtLink v-if="iconLeft" :class="iconClasses" @click="onIconClick($event)">
      <Component :is="iconLeft" :class="['h-4 w-4', badgeDotIconColorClasses]" />
    </NuxtLink>
  </span>
</template>
<script setup lang="ts">
import { ConcreteComponent } from 'vue'

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
  iconLeft?: ConcreteComponent

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
  () => props.colorClasses || 'bg-blue-100 text-blue-800'
)

const badgeDotIconColorClasses = computed(
  () => props.dotIconColorClasses || 'text-blue-400'
)

const badgeClasses = computed(() => {
  const classParts: string[] = [
    'inline-flex items-center',
    badgeColorClasses.value,
    props.size === 'lg' ? 'px-3 py-0.5 label' : 'px-2.5 py-0.5 caption font-medium'
  ]

  if (props.rounded) {
    classParts.push('rounded')
    classParts.push(
      props.size === 'lg' ? 'px-2 py-0.5 label' : 'px-2.5 py-0.5 caption font-medium'
    )
  } else {
    classParts.push('rounded-full')
    classParts.push(
      props.size === 'lg' ? 'px-2.5 py-0.5 label' : 'px-2.5 py-0.5 caption font-medium'
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

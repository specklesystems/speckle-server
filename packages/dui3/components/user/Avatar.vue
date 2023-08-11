<template>
  <div
    :class="[
      'text-foreground-on-primary flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold uppercase transition',
      sizeClasses,
      bgClasses,
      borderClasses,
      hoverClasses,
      activeClasses
    ]"
  >
    <slot>
      <div
        v-if="user?.avatar"
        class="h-full w-full bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: `url('${user.avatar}')` }"
      />
      <div
        v-else-if="initials"
        class="flex h-full w-full select-none items-center justify-center"
      >
        {{ initials }}
      </div>
      <div v-else><UserCircleIcon :class="iconClasses" /></div>
    </slot>
  </div>
</template>
<script setup lang="ts">
import { UserCircleIcon } from '@heroicons/vue/20/solid'
type UserAvatar = {
  name: string
  avatar?: string
}

export type UserAvatarSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'editable'

const props = withDefaults(
  defineProps<{
    user?: UserAvatar
    size?: UserAvatarSize
    hoverEffect?: boolean
    active?: boolean
    noBorder?: boolean
    noBackground?: boolean
  }>(),
  {
    user: undefined,
    size: 'base',
    hoverEffect: false
  }
)

const initials = computed(() => {
  if (!props.user?.name.length) return
  const parts = props.user.name.split(' ')
  const firstLetter = parts[0]?.[0] || ''
  const secondLetter = parts[1]?.[0] || ''

  if (props.size === 'sm' || props.size === 'xs') return firstLetter
  return firstLetter + secondLetter
})

const borderClasses = computed(() => {
  if (props.noBorder) return ''
  return 'border-2 border-foundation'
})

const bgClasses = computed(() => {
  if (props.noBackground) return ''
  return 'bg-primary'
})

const hoverClasses = computed(() => {
  if (props.hoverEffect)
    return 'hover:border-primary focus:border-primary active:scale-95'
  return ''
})

const activeClasses = computed(() => {
  if (props.active) return 'border-primary'
  return ''
})

const heightClasses = computed(() => {
  const size = props.size
  switch (size) {
    case 'xs':
      return 'h-5'
    case 'sm':
      return 'h-6'
    case 'lg':
      return 'h-10'
    case 'xl':
      return 'h-14'
    case 'editable':
      return 'h-60'
    case 'base':
    default:
      return 'h-8'
  }
})

const widthClasses = computed(() => {
  const size = props.size
  switch (size) {
    case 'xs':
      return 'w-5'
    case 'sm':
      return 'w-6'
    case 'lg':
      return 'w-10'
    case 'xl':
      return 'w-14'
    case 'editable':
      return 'w-60'
    case 'base':
    default:
      return 'w-8'
  }
})

const textClasses = computed(() => {
  const size = props.size
  switch (size) {
    case 'xs':
      return 'text-tiny'
    case 'sm':
      return 'text-xs'
    case 'lg':
      return 'text-md'
    case 'xl':
      return 'text-2xl'
    case 'editable':
      return 'h1'
    case 'base':
    default:
      return 'text-sm'
  }
})

const iconClasses = computed(() => {
  const size = props.size
  switch (size) {
    case 'xs':
      return 'w-3 h-3'
    case 'sm':
      return 'w-3 h-3'
    case 'lg':
      return 'w-5 h-5'
    case 'xl':
      return 'w-8 h-8'
    case 'editable':
      return 'w-20 h-20'
    case 'base':
    default:
      return 'w-4 h-4'
  }
})

const sizeClasses = computed(
  () => `${widthClasses.value} ${heightClasses.value} ${textClasses.value}`
)
</script>

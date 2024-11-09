<template>
  <div
    :class="[
      'text-foreground-on-primary flex shrink-0 items-center justify-center overflow-hidden rounded-full uppercase transition',
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
        v-tippy="!hideTooltip ? props.user?.name : undefined"
        class="h-full w-full bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: `url('${user.avatar}')` }"
      />
      <div
        v-else-if="initials"
        v-tippy="!hideTooltip ? props.user?.name : undefined"
        class="flex h-full w-full select-none items-center justify-center"
      >
        {{ initials }}
      </div>
      <div v-else><UserCircleIcon :class="iconClasses" /></div>
    </slot>
    <slot name="absolute-anchor" />
  </div>
</template>
<script setup lang="ts">
import { UserCircleIcon } from '@heroicons/vue/24/solid'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { computed, toRefs } from 'vue'
import { useAvatarSizeClasses } from '~~/src/composables/user/avatar'
import type { AvatarUser, UserAvatarSize } from '~~/src/composables/user/avatar'

const props = withDefaults(
  defineProps<{
    user?: MaybeNullOrUndefined<AvatarUser>
    size?: UserAvatarSize
    hoverEffect?: boolean
    active?: boolean
    noBorder?: boolean
    noBg?: boolean
    hideTooltip?: boolean
  }>(),
  {
    size: 'base',
    hoverEffect: false,
    user: null
  }
)

const { sizeClasses, iconClasses } = useAvatarSizeClasses({ props: toRefs(props) })

const initials = computed(() => {
  if (!props.user?.name?.length) return
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
  if (props.noBg) return ''
  return 'bg-info-darker'
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
</script>

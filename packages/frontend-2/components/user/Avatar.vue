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
import { UserCircleIcon } from '@heroicons/vue/24/solid'
import { graphql } from '~~/lib/common/generated/gql'
import {
  AvatarUserType,
  UserAvatarSize,
  useAvatarSizeClasses
} from '~~/lib/user/composables/avatar'

graphql(`
  fragment AppAuthorAvatar on AppAuthor {
    id
    name
    avatar
  }
`)

graphql(`
  fragment LimitedUserAvatar on LimitedUser {
    id
    name
    avatar
  }
`)

graphql(`
  fragment ActiveUserAvatar on User {
    id
    name
    avatar
  }
`)

const props = withDefaults(
  defineProps<{
    user?: AvatarUserType | null
    size?: UserAvatarSize
    hoverEffect?: boolean
    active?: boolean
    noBorder?: boolean
    noBg?: boolean
  }>(),
  {
    size: 'base',
    hoverEffect: false,
    user: undefined
  }
)

const { sizeClasses, iconClasses } = useAvatarSizeClasses({ props: toRefs(props) })

const initials = computed(() => {
  if (!props.user?.name?.length) return
  const parts = props.user.name.split(' ')
  if (props.size === 'sm' || props.size === 'xs') return parts[0][0]
  return parts[0][0] + (parts[1]?.[0] || '')
})

const borderClasses = computed(() => {
  if (props.noBorder) return ''
  return 'border-2 border-foundation'
})

const bgClasses = computed(() => {
  if (props.noBg) return ''
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
</script>

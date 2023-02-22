<template>
  <div
    :class="[
      'shrink-0 rounded-full overflow-hidden border-2 border-foundation bg-primary flex items-center justify-center uppercase text-xs font-semibold text-foreground-on-primary transition',
      sizeClasses,
      hoverClasses
    ]"
  >
    <slot>
      <div
        v-if="user?.avatar"
        class="bg-no-repeat bg-center bg-cover w-full h-full"
        :style="{ backgroundImage: `url('${user.avatar}')` }"
      />
      <div
        v-else-if="initials"
        class="w-full h-full flex items-center justify-center select-none"
      >
        {{ initials }}
      </div>
      <div v-else>
        <UserCircleIcon class="w-5 h-5" />
      </div>
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
  }>(),
  {
    size: 'base',
    hoverEffect: false,
    user: undefined
  }
)

const { sizeClasses } = useAvatarSizeClasses({ props: toRefs(props) })

const initials = computed(() => {
  if (!props.user?.name.length) return
  const parts = props.user.name.split(' ')
  return parts[0][0] + (parts[1]?.[0] || '')
})

const hoverClasses = computed(() => {
  if (props.hoverEffect)
    return 'hover:border-primary focus:border-primary active:scale-95'
  return ''
})
</script>

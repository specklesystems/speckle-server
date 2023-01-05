<template>
  <div ref="elementToWatchForChanges" :class="`flex ${overlap ? '-space-x-2' : ''}`">
    <div
      ref="itemContainer"
      :class="`flex flex-wrap overflow-hidden ${
        overlap ? '-space-x-2 ' : ''
      } ${heightClasses}`"
    >
      <UserAvatar v-for="user in items" :key="user.id" :user="user" :size="size" />
    </div>
    <UserAvatar v-if="finalHiddenItemCount" :size="size">
      +{{ finalHiddenItemCount }}
    </UserAvatar>
  </div>
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { useWrappingContainerHiddenCount } from '~~/lib/layout/composables/resize'
import {
  AvatarUserType,
  UserAvatarSize,
  useAvatarSizeClasses
} from '~~/lib/user/composables/avatar'

const props = withDefaults(
  defineProps<{
    users: AvatarUserType[]
    overlap?: boolean
    size?: UserAvatarSize
    maxCount?: number
  }>(),
  {
    users: () => [],
    overlap: true,
    size: 'base',
    maxCount: undefined
  }
)

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)

const { hiddenItemCount } = useWrappingContainerHiddenCount({
  elementToWatchForChanges,
  itemContainer,
  trackResize: true,
  trackMutations: true
})

const { heightClasses } = useAvatarSizeClasses({ props: toRefs(props) })

const maxCountHiddenItemCount = computed(() => {
  if (!props.maxCount) return 0
  return Math.max(props.users.length - props.maxCount, 0)
})

const finalHiddenItemCount = computed(
  () => hiddenItemCount.value + maxCountHiddenItemCount.value
)

const items = computed(() =>
  props.maxCount ? props.users.slice(0, props.maxCount) : props.users
)
</script>

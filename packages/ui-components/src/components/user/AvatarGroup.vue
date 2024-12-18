<template>
  <div ref="elementToWatchForChanges" :class="`flex ${overlap ? '-space-x-2' : ''}`">
    <div
      ref="itemContainer"
      :class="`flex flex-wrap overflow-hidden ${
        overlap ? '-space-x-2 ' : ''
      } ${heightClasses}`"
    >
      <UserAvatar
        v-for="(user, i) in visibleUsers"
        :key="user.id || i"
        :user="user"
        :size="size"
        :hide-tooltip="hideTooltips"
      />
    </div>
    <UserAvatar v-if="totalHiddenCount" :size="size" class="select-none">
      +{{ totalHiddenCount }}
    </UserAvatar>
  </div>
</template>
<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { computed, ref, toRefs } from 'vue'
import UserAvatar from '~~/src/components/user/Avatar.vue'
import { useWrappingContainerHiddenCount } from '~~/src/composables/layout/resize'
import { useAvatarSizeClasses } from '~~/src/composables/user/avatar'
import type { UserAvatarSize, AvatarUserWithId } from '~~/src/composables/user/avatar'

const props = withDefaults(
  defineProps<{
    users: AvatarUserWithId[]
    overlap?: boolean
    size?: UserAvatarSize
    maxCount?: number
    hideTooltips?: boolean
    maxAvatars?: number
  }>(),
  {
    users: () => [],
    overlap: true,
    size: 'base',
    maxCount: undefined,
    hideTooltips: false,
    maxAvatars: undefined
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

const visibleUsers = computed(() => {
  const result = props.users
  const limit = Math.min(props.maxCount ?? Infinity, props.maxAvatars ?? Infinity)
  return result.slice(0, limit)
})

const maxAvatarsHiddenCount = computed(() => {
  if (!props.maxAvatars) return 0
  return Math.max(props.users.length - props.maxAvatars, 0)
})

const totalHiddenCount = computed(
  () =>
    hiddenItemCount.value + maxCountHiddenItemCount.value + maxAvatarsHiddenCount.value
)
</script>

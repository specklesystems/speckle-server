<template>
  <div ref="elementToWatchForChanges" :class="`flex ${overlap ? '-space-x-2' : ''}`">
    <div
      ref="itemContainer"
      :class="`flex flex-wrap overflow-hidden ${
        overlap ? '-space-x-2 ' : ''
      } ${heightClasses}`"
    >
      <UserAvatar
        v-for="(user, i) in items"
        :key="user.id || i"
        :user="user"
        :size="size"
        :hide-tooltip="hideTooltips"
      />
    </div>
    <UserAvatar v-if="finalHiddenItemCount" :size="size">
      +{{ finalHiddenItemCount }}
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
  }>(),
  {
    users: () => [],
    overlap: true,
    size: 'base',
    maxCount: undefined,
    hideTooltips: false
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

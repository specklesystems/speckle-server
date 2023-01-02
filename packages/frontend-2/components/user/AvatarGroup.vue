<template>
  <div :class="`flex ${overlap ? '-space-x-2' : ''}`">
    <UserAvatar v-for="user in displayUsers" :key="user.id" :user="user" :size="size" />
    <UserAvatar v-if="!canShowAll" :size="size">
      +{{ notDisplayedUsersCount }}
    </UserAvatar>
  </div>
</template>
<script setup lang="ts">
type SimpleUser = {
  id: string
  avatar: string
  name: string
}

const props = withDefaults(
  defineProps<{
    users: SimpleUser[]
    overlap?: boolean
    maxCount?: number
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  }>(),
  {
    users: () => new Array<SimpleUser>(),
    overlap: true,
    maxCount: 3,
    size: 'base'
  }
)

const canShowAll = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-plus-operands
  return props.users.length <= props.maxCount + 1
})

const displayUsers = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  if (canShowAll.value) return props.users
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  return props.users.slice(0, props.maxCount)
})

const notDisplayedUsersCount = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return props.users.length - props.maxCount
})
</script>

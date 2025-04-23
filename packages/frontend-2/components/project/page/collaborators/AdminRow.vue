<template>
  <div
    class="bg-foundation flex items-center gap-2 py-2 px-3 border-t border-x last:border-b border-outline-3 first:rounded-t-lg last:rounded-b-lg"
  >
    <div class="flex flex-1 items-center gap-x-3.5">
      <UserAvatar hide-tooltip :user="user" />
      <p class="text-body-xs">{{ name }}</p>
    </div>
    <div class="flex items-center justify-end text-body-2xs">
      {{ roleSelectItems[Roles.Stream.Owner].title }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type MaybeNullOrUndefined, Roles } from '@speckle/shared'
import { roleSelectItems } from '~~/lib/projects/helpers/components'

const props = defineProps<{
  name: string
  avatar: MaybeNullOrUndefined<string>
}>()

const user = computed(() => {
  return {
    name: props.name,
    avatar: props.avatar
  }
})
</script>

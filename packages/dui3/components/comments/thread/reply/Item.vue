<template>
  <div
    class="py-1 sm:py-2 my-1 sm:my-2 px-2 flex flex-col rounded transition cursor-pointer"
  >
    <div class="flex items-center space-x-1">
      <UserAvatar :user="reply.author" />
      <span class="grow truncate text-xs sm:text-sm font-medium">
        {{ reply.author.name }}
      </span>
      <span class="text-xs truncate text-foreground-2 font-medium">
        {{ createdAt }}
      </span>
    </div>
    <div class="text-body-xs mt-1">
      {{ reply.rawText }}
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import type { CommentRepliesItemFragment } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  reply: CommentRepliesItemFragment
}>()

const createdAt = computed(() => {
  return dayjs(props.reply.createdAt).from(dayjs())
})
</script>

<template>
  <div class="flex flex-col items-center space-y-1">
    <div class="bg-foundation rounded-full caption space-x-2 p-1">
      <span>{{ absoluteDate }}</span>
      <span>{{ timeFromNow }}</span>
    </div>
    <div class="bg-foundation rounded-full px-4 py-2 w-full">
      <div class="flex items-center">
        <UserAvatar :user="comment.author" size="sm" class="mr-2" />
        <span class="grow truncate text-sm font-medium">
          {{ comment.author.name }}
        </span>
      </div>
      <div class="truncate text-sm text-foreground-2">
        {{ comment.rawText }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~~/lib/common/generated/gql'
import { ViewerAnchoredPointThreadCommentFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ViewerAnchoredPointThreadComment on Comment {
    id
    rawText
    author {
      ...LimitedUserAvatar
    }
    createdAt
  }
`)

const props = defineProps<{
  comment: ViewerAnchoredPointThreadCommentFragment
}>()

const absoluteDate = computed(() =>
  dayjs(props.comment.createdAt).toDate().toLocaleString()
)
const timeFromNow = computed(() => dayjs(props.comment.createdAt).fromNow())
</script>

<template>
  <div class="p-2 flex flex-col">
    <h2 class="text-sm font-bold text-foreground-2">Threads</h2>
    <div class="flex flex-col">
      <div
        v-for="thread in commentThreads"
        :key="thread.id"
        :class="[
          'py-4 flex flex-col',
          thread.id !== lastThread?.id ? 'border-b border-foreground-3' : ''
        ]"
      >
        <div class="flex items-center mb-1">
          <UserAvatar :user="thread.author" size="sm" class="mr-2" />
          <span class="grow truncate text-sm font-medium">
            {{ thread.author.name }}
          </span>
          <span class="text-foreground-2 text-sm">
            {{ formatDate(thread.createdAt) }}
          </span>
        </div>
        <div class="truncate text-sm text-foreground-2">
          {{ thread.rawText }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import dayjs from 'dayjs'
import { useInjectedViewerLoadedResources } from '~~/lib/viewer/composables/setup'

graphql(`
  fragment ViewerCommentsReplyItem on Comment {
    id
    rawText
    text {
      doc
    }
    author {
      ...LimitedUserAvatar
    }
    createdAt
  }
`)

graphql(`
  fragment ViewerCommentsListItem on Comment {
    id
    rawText
    author {
      ...LimitedUserAvatar
    }
    createdAt
    viewedAt
    replies {
      totalCount
      cursor
      items {
        ...ViewerCommentsReplyItem
      }
    }
  }
`)

const { commentThreads } = useInjectedViewerLoadedResources()
const lastThread = computed(() =>
  commentThreads.value.length
    ? commentThreads.value[commentThreads.value.length - 1]
    : null
)

const formatDate = (date: string) => dayjs(date).from(dayjs())
</script>

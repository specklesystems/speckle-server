<template>
  <div
    class="bg-foundation rounded-lg shadow flex flex-col space-y-1 xxxoverflow-hidden"
  >
    <!-- <h2 class="font-bold text-foreground-2 px-2 py-2">Comments</h2> -->
    <div
      class="flex sticky top-0 px-2 py-2 bg-foundation-2 shadow-md rounded-t-lg justify-between"
    >
      <FormButton
        size="xs"
        :icon-left="includeArchived ? CheckCircleIcon : CheckCircleIconOutlined"
        text
        :disabled="commentThreadsMetadata?.totalArchivedCount === 0"
        @click="includeArchived = includeArchived ? undefined : 'includeArchived'"
      >
        {{ includeArchived ? 'Hide' : 'Show' }} Resolved ({{
          commentThreadsMetadata?.totalArchivedCount
        }})
      </FormButton>
      <FormButton size="xs" text @click="hideBubbles = !hideBubbles">
        {{ !hideBubbles ? 'Hide' : 'Show' }} Threads
      </FormButton>
    </div>
    <div class="flex flex-col px-1">
      <ViewerCommentsListItem
        v-for="thread in commentThreads"
        :key="thread.id"
        :thread="thread"
        :xxxclass="[thread.id !== lastThread?.id ? 'border-b border-foreground-3' : '']"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'
import { CheckCircleIcon as CheckCircleIconOutlined } from '@heroicons/vue/24/outline'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'

graphql(`
  fragment ViewerCommentsListItem on Comment {
    id
    rawText
    archived
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
    replyAuthors(limit: 4) {
      totalCount
      items {
        ...FormUsersSelectItem
      }
    }
    resources {
      resourceId
      resourceType
    }
  }
`)

const { commentThreads, commentThreadsMetadata } = useInjectedViewerLoadedResources()
const { threadFilters } = useInjectedViewerRequestedResources()
const {
  threads: { hideBubbles }
} = useInjectedViewerInterfaceState()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loadedVersionsOnly = computed({
  get: () =>
    threadFilters.value.loadedVersionsOnly || false ? 'loadedVersionsOnly' : undefined,
  set: (newVal) => (threadFilters.value.loadedVersionsOnly = !!newVal)
})
const includeArchived = computed({
  get: () =>
    threadFilters.value.includeArchived || false ? 'includeArchived' : undefined,
  set: (newVal) => (threadFilters.value.includeArchived = !!newVal)
})

const lastThread = computed(() =>
  commentThreads.value.length
    ? commentThreads.value[commentThreads.value.length - 1]
    : null
)
</script>

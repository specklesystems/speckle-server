<template>
  <ViewerLayoutPanel @close="$emit('close')">
    <template #actions>
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
    </template>
    <div class="flex flex-col px-1">
      <ViewerCommentsListItem
        v-for="thread in commentThreads"
        :key="thread.id"
        :thread="thread"
      />
      <div v-if="commentThreads.length === 0">TODO: Empty state</div>
    </div>
  </ViewerLayoutPanel>
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

defineEmits(['close'])

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
</script>

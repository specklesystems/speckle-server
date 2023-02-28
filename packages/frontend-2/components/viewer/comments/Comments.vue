<template>
  <div class="bg-foundation rounded-lg shadow flex flex-col space-y-1">
    <h2 class="font-bold text-foreground-2 px-2 py-2">Comments</h2>
    <!-- <div class="flex">
      <FormButton
        size="xs"
        :icon-right="CheckCircleIcon"
        :outlined="!includeArchived"
        @click="includeArchived = includeArchived ? undefined : 'includeArchived'"
      >
        Show Resolved
      </FormButton>
    </div> -->
    <div class="flex">
      <FormCheckbox
        v-model="includeArchived"
        name="includeArchived"
        :label="archivedLabel"
      />
      <FormCheckbox
        v-model="loadedVersionsOnly"
        name="loadedVersionsOnly"
        label="Loaded versions only"
      />
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

const totalArchived = computed(() => commentThreadsMetadata.value?.totalArchivedCount)
const archivedLabel = computed(() => {
  const base = 'Show resolved'
  if (!totalArchived.value) return base

  return `${base} (${totalArchived.value})`
})
</script>

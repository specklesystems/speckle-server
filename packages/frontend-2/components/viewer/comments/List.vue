<template>
  <div class="p-2 flex flex-col space-y-1">
    <h2 class="text-sm font-bold text-foreground-2">Threads</h2>
    <div class="flex flex-col">
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
    <div class="flex flex-col">
      <ViewerCommentsListItem
        v-for="thread in commentThreads"
        :key="thread.id"
        :thread="thread"
        :class="[thread.id !== lastThread?.id ? 'border-b border-foreground-3' : '']"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'

/**
 * - TODO: FIGURE OUT VIEWERLOADEDRESOURCES NOT PRELOADING IN SSR
 */

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
  const base = 'Include archived'
  if (!totalArchived.value) return base

  return `${base} (${totalArchived.value})`
})
</script>

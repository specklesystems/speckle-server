<template>
  <div class="p-2 flex flex-col space-y-1">
    <h2 class="text-sm font-bold text-foreground-2">Threads</h2>
    <div class="flex flex-col">
      <FormCheckbox
        v-model="includeArchived"
        name="includeArchived"
        label="Include archived"
      />
      <FormCheckbox
        v-model="loadedVersionsOnly"
        name="loadedVersionsOnly"
        label="Loaded versions only"
      />
    </div>
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
        <div class="text-xs mt-1">
          [Archived: {{ thread.archived }}] [Is commit loaded:
          {{ isCommitLoaded(thread) ? 'yes' : 'no' }}]
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import dayjs from 'dayjs'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'
import {
  ResourceType,
  ViewerCommentsListItemFragment
} from '~~/lib/common/generated/gql/graphql'

/**
 * TODO: Move out each thread list entry to separate component for proper caching
 * TODO: Figure out stale cache between project.commentThreads w/ different filters
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

const { commentThreads, resourceItems } = useInjectedViewerLoadedResources()
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

const formatDate = (date: string) => dayjs(date).from(dayjs())

const isCommitLoaded = (thread: ViewerCommentsListItemFragment) => {
  const loadedResources = resourceItems.value
  const resourceLinks = thread.resources

  const objectLinks = resourceLinks
    .filter((l) => l.resourceType === ResourceType.Object)
    .map((l) => l.resourceId)
  const commitLinks = resourceLinks
    .filter((l) => l.resourceType === ResourceType.Commit)
    .map((l) => l.resourceId)

  if (loadedResources.some((lr) => objectLinks.includes(lr.objectId))) return true
  if (loadedResources.some((lr) => lr.versionId && commitLinks.includes(lr.versionId)))
    return true

  return false
}
</script>

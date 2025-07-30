<template>
  <ViewerLayoutSidePanel>
    <template #title>
      <span>Discussions</span>
    </template>
    <template #actions>
      <div class="relative pr-2">
        <FormButton
          ref="settingsButtonRef"
          hide-text
          size="sm"
          color="subtle"
          :icon-left="settingsIcon"
          :class="showVisibilityOptions ? '!text-primary-focus !bg-info-lighter' : ''"
          @click="showVisibilityOptions = !showVisibilityOptions"
        />

        <ViewerLayoutPanel
          v-if="showVisibilityOptions"
          class="absolute right-2 top-full w-56 z-50"
        >
          <div class="p-1">
            <ViewerMenuItem
              label="Show in 3D model"
              :active="!hideBubbles"
              @click="hideBubbles = !hideBubbles"
            />
            <ViewerMenuItem
              :label="`Show resolved (${
                commentThreadsMetadata?.totalArchivedCount || 0
              })`"
              :active="!!includeArchived"
              @click="includeArchived = includeArchived ? undefined : 'includeArchived'"
            />
            <ViewerMenuItem
              label="Exclude threads from other versions"
              :active="!!loadedVersionsOnly"
              @click="
                loadedVersionsOnly = loadedVersionsOnly
                  ? undefined
                  : 'loadedVersionsOnly'
              "
            />
          </div>
        </ViewerLayoutPanel>
      </div>
    </template>
    <div class="flex flex-col">
      <div class="flex flex-col gap-y-2 p-1">
        <ViewerCommentsListItem
          v-for="thread in commentThreads"
          :key="thread.id"
          :thread="thread"
        />
        <div v-if="commentThreads.length === 0" class="pb-4">
          <ProjectPageLatestItemsCommentsEmptyState
            small
            :show-button="canPostComment && hasSelectedObjects"
            :text="
              hasSelectedObjects ? undefined : 'Select an object to start collaborating'
            "
            @new-discussion="onNewDiscussion"
          />
        </div>
      </div>
    </div>
  </ViewerLayoutSidePanel>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ConcreteComponent } from 'vue'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useCheckViewerCommentingAccess } from '~~/lib/viewer/composables/commentManagement'
import { useSelectionUtilities } from '~~/lib/viewer/composables/ui'

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
  threads: {
    hideBubbles,
    openThread: { newThreadEditor }
  }
} = useInjectedViewerInterfaceState()
const canPostComment = useCheckViewerCommentingAccess()

const showVisibilityOptions = ref(false)
const settingsIcon = resolveComponent('IconViewerSettings') as ConcreteComponent

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

const mp = useMixpanel()
watch(loadedVersionsOnly, (newVal) =>
  mp.track('Comment Action', {
    type: 'action',
    name: 'settings-change',
    loadedVersionsOnly: newVal
  })
)
watch(includeArchived, (newVal) =>
  mp.track('Comment Action', {
    type: 'action',
    name: 'settings-change',
    includeArchived: newVal
  })
)
watch(includeArchived, (newVal) =>
  mp.track('Comment Action', {
    type: 'action',
    name: 'settings-change',
    includeArchived: newVal
  })
)

const { objectIds: selectedObjectIds } = useSelectionUtilities()

const hasSelectedObjects = computed(() => selectedObjectIds.value.size > 0)

const onNewDiscussion = () => {
  if (!hasSelectedObjects.value) return
  newThreadEditor.value = true
}
</script>

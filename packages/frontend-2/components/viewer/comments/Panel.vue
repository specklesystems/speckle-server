<template>
  <ViewerLayoutSidePanel>
    <template #title>Discussions</template>
    <div class="px-4 py-1 border-b border-outline-2">
      <FormButton
        text
        size="sm"
        color="subtle"
        :icon-right="showVisibilityOptions ? ChevronUpIcon : ChevronDownIcon"
        @click="showVisibilityOptions = !showVisibilityOptions"
      >
        Discussion visibility options
      </FormButton>
    </div>
    <div class="flex flex-col">
      <div
        v-show="showVisibilityOptions"
        class="sticky top-10 px-2 py-1.5 flex flex-col gap-y-0.5 border-b border-outline-2 bg-foundation"
      >
        <FormButton
          size="sm"
          :icon-left="!hideBubbles ? CheckCircleIcon : CheckCircleIconOutlined"
          text
          class="!text-foreground"
          @click="hideBubbles = !hideBubbles"
        >
          Show in 3D model
        </FormButton>

        <FormButton
          size="sm"
          :icon-left="includeArchived ? CheckCircleIcon : CheckCircleIconOutlined"
          text
          class="!text-foreground"
          @click="includeArchived = includeArchived ? undefined : 'includeArchived'"
        >
          Show resolved ({{ commentThreadsMetadata?.totalArchivedCount }})
        </FormButton>

        <FormButton
          size="sm"
          :icon-left="loadedVersionsOnly ? CheckCircleIcon : CheckCircleIconOutlined"
          text
          class="!text-foreground"
          @click="
            loadedVersionsOnly = loadedVersionsOnly ? undefined : 'loadedVersionsOnly'
          "
        >
          Exclude threads from other versions
        </FormButton>
      </div>
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
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/vue/24/solid'
import { CheckCircleIcon as CheckCircleIconOutlined } from '@heroicons/vue/24/outline'
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

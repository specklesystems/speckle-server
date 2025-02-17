<template>
  <ViewerLayoutPanel @close="$emit('close')">
    <template #title>Discussions</template>
    <template #actions>
      <FormButton
        text
        size="sm"
        color="subtle"
        :icon-right="showVisibilityOptions ? ChevronUpIcon : ChevronDownIcon"
        @click="showVisibilityOptions = !showVisibilityOptions"
      >
        Discussion visibility options
      </FormButton>
    </template>
    <div class="flex flex-col">
      <div
        v-show="showVisibilityOptions"
        class="sticky top-10 px-2 py-2 flex flex-col justify-start text-left border-b-2 border-primary-muted bg-foundation"
      >
        <div>
          <FormButton
            size="sm"
            :icon-left="!hideBubbles ? CheckCircleIcon : CheckCircleIconOutlined"
            text
            @click="hideBubbles = !hideBubbles"
          >
            Show in 3D model
          </FormButton>
        </div>
        <div>
          <FormButton
            size="sm"
            :icon-left="includeArchived ? CheckCircleIcon : CheckCircleIconOutlined"
            text
            :disabled="commentThreadsMetadata?.totalArchivedCount === 0"
            @click="includeArchived = includeArchived ? undefined : 'includeArchived'"
          >
            {{ includeArchived ? 'Hide' : 'Show' }} Resolved ({{
              commentThreadsMetadata?.totalArchivedCount
            }})
          </FormButton>
        </div>
        <div>
          <FormButton
            size="sm"
            :icon-left="loadedVersionsOnly ? CheckCircleIcon : CheckCircleIconOutlined"
            text
            class="!text-left"
            @click="
              loadedVersionsOnly = loadedVersionsOnly ? undefined : 'loadedVersionsOnly'
            "
          >
            Exclude threads from other versions
          </FormButton>
        </div>
      </div>
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
      <!-- TODO: new thread on click in centre of screen, I can't figure out how -->
      <!-- <div class="py-2 text-center">
        <FormButton>New Discussion</FormButton>
      </div> -->
    </div>
  </ViewerLayoutPanel>
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

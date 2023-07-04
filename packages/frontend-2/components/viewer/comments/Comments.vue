<template>
  <ViewerLayoutPanel @close="$emit('close')">
    <template #actions>
      <FormButton
        text
        size="xs"
        :icon-right="showVisibilityOptions ? ChevronUpIcon : ChevronDownIcon"
        @click="showVisibilityOptions = !showVisibilityOptions"
      >
        Discussion Visibility Options
      </FormButton>
    </template>
    <div class="flex flex-col px-1">
      <div
        v-show="showVisibilityOptions"
        class="sticky top-10 px-0 py-2 flex flex-col justify-start text-left border-b-2 border-primary-muted bg-foundation"
      >
        <div>
          <FormButton
            size="xs"
            :icon-left="!hideBubbles ? CheckCircleIcon : CheckCircleIconOutlined"
            text
            @click="hideBubbles = !hideBubbles"
          >
            Show In 3D Model
          </FormButton>
        </div>
        <div>
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
        </div>
        <div>
          <FormButton
            size="xs"
            :icon-left="loadedVersionsOnly ? CheckCircleIcon : CheckCircleIconOutlined"
            text
            @click="
              loadedVersionsOnly = loadedVersionsOnly ? undefined : 'loadedVersionsOnly'
            "
          >
            Exclude Other Versions
          </FormButton>
        </div>
      </div>
      <ViewerCommentsListItem
        v-for="thread in commentThreads"
        :key="thread.id"
        :thread="thread"
      />
      <div v-if="commentThreads.length === 0">
        <ProjectPageLatestItemsCommentsIntroCard
          small
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

const showVisibilityOptions = ref(false)

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

const onNewDiscussion = () => {
  newThreadEditor.value = true
}
</script>

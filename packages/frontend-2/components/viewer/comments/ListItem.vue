<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
  <div
    :class="`p-1.5 pb-1 flex flex-col rounded-md cursor-pointer hover:bg-highlight-3
      ${isOpenInViewer ? 'bg-highlight-2' : ''}
    `"
    @click="open(thread.id)"
  >
    <div class="flex w-full items-center">
      <div class="flex-1 flex flex-col gap-y-1.5">
        <div class="flex items-center space-x-1.5">
          <UserAvatarGroup :users="threadAuthors" size="sm" />
          <span class="grow truncate text-body-2xs text-foreground">
            {{ thread.author.name }}
            <span v-if="threadAuthors.length !== 1">
              & {{ thread.replyAuthors.totalCount }} others
            </span>
          </span>
        </div>
        <div class="truncate text-body-2xs text-foreground dark:text-foreground-2">
          {{ thread.rawText }}
        </div>
        <div class="text-body-3xs flex items-center space-x-3 text-foreground-3 mb-1">
          <span
            v-if="!isThreadResourceLoaded"
            v-tippy="'Conversation started in a different version.'"
          >
            <ExclamationCircleIcon class="w-4 h-4" />
          </span>
          <span
            v-if="isOutOfContext"
            v-tippy="'References models not currently loaded.'"
          >
            <ExclamationCircleIcon class="w-4 h-4" />
          </span>
          <span>
            {{ thread.replies.totalCount }}
            {{ thread.replies.totalCount === 1 ? 'reply' : 'replies' }}
          </span>
          <span v-tippy="createdAt.full">
            {{ createdAt.relative }}
          </span>
        </div>
      </div>
      <FormButton
        v-tippy="thread.archived ? 'Unresolve' : 'Resolve'"
        :icon-left="thread.archived ? CheckCircleIcon : CheckCircleIconOutlined"
        text
        hide-text
        :disabled="!canArchiveOrUnarchive"
        @click.stop="toggleCommentResolvedStatus()"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { CheckCircleIcon } from '@heroicons/vue/24/solid'
import { CheckCircleIcon as CheckCircleIconOutlined } from '@heroicons/vue/24/outline'
import { ExclamationCircleIcon } from '@heroicons/vue/20/solid'
import type { LoadedCommentThread } from '~~/lib/viewer/composables/setup'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerLoadedResources,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { ResourceType } from '~~/lib/common/generated/gql/graphql'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import {
  useArchiveComment,
  useCommentModelContext
} from '~~/lib/viewer/composables/commentManagement'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { Roles } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useThreadUtilities } from '~~/lib/viewer/composables/ui'

const props = defineProps<{
  thread: LoadedCommentThread
}>()

const { resourceItems } = useInjectedViewerLoadedResources()
const {
  threads: { openThread }
} = useInjectedViewerInterfaceState()
const { open: openThreadRaw } = useThreadUtilities()
const { activeUser } = useActiveUser()
const archiveComment = useArchiveComment()
const { triggerNotification } = useGlobalToast()
const {
  projectId,
  resources: {
    response: { project }
  }
} = useInjectedViewerState()

const mp = useMixpanel()
const open = (id: string) => {
  openThreadRaw(id)
  mp.track('Comment Action', {
    type: 'action',
    name: 'toggle',
    status: !isOpenInViewer.value,
    source: 'sidebar'
  })
}

const createdAt = computed(() => {
  return {
    full: formattedFullDate(props.thread.createdAt),
    relative: formattedRelativeDate(props.thread.createdAt, { capitalize: true })
  }
})

const isThreadResourceLoaded = computed(() => {
  const thread = props.thread
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
})

const isOpenInViewer = computed(() => openThread.thread.value?.id === props.thread.id)

const threadAuthors = computed(() => {
  const authors = [props.thread.author]
  for (const author of props.thread.replyAuthors.items) {
    if (!authors.find((u) => u.id === author.id)) authors.push(author)
  }
  return authors
})

const canArchiveOrUnarchive = computed(
  () =>
    activeUser.value &&
    (props.thread.author.id === activeUser.value.id ||
      project.value?.role === Roles.Stream.Owner)
)

const toggleCommentResolvedStatus = async () => {
  await archiveComment({
    commentId: props.thread.id,
    projectId: projectId.value,
    archived: !props.thread.archived
  })
  mp.track('Comment Action', {
    type: 'action',
    name: 'archive',
    status: !props.thread.archived
  })
  triggerNotification({
    title: `Thread ${props.thread.archived ? 'reopened.' : 'resolved.'}`,
    type: ToastNotificationType.Info
  })
}

const { isOutOfContext } = useCommentModelContext(props.thread)
</script>

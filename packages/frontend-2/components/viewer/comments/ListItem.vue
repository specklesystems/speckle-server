<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
  <div
    :class="`py-1 sm:py-2 my-1 sm:my-2 px-2 flex flex-col bg-foundation border-l-4 hover:shadow-lg hover:bg-primary-muted rounded transition cursor-pointer
      ${isOpenInViewer ? 'border-primary' : 'border-transparent'}
    `"
    @click="open(thread.id)"
  >
    <div class="flex justify-between items-center">
      <UserAvatarGroup :users="threadAuthors" />
      <FormButton
        v-tippy="thread.archived ? 'Unresolve' : 'Resolve'"
        :icon-left="thread.archived ? CheckCircleIcon : CheckCircleIconOutlined"
        text
        hide-text
        :disabled="!canArchiveOrUnarchive"
        @click.stop="toggleCommentResolvedStatus()"
      ></FormButton>
    </div>
    <div class="flex items-center space-x-1">
      <span class="grow truncate text-body-xs font-medium text-foreground-2">
        {{ thread.author.name }}
        <span v-if="threadAuthors.length !== 1">
          & {{ thread.replyAuthors.totalCount }} others
        </span>
      </span>
    </div>
    <div class="truncate text-body-xs mb-1">
      {{ thread.rawText }}
    </div>
    <div
      :class="`text-xs font-medium flex items-center space-x-2 ${
        thread.replies.totalCount > 0 ? 'text-primary' : 'text-foreground-2'
      } mb-1`"
    >
      <span
        v-if="!isThreadResourceLoaded"
        v-tippy="'Conversation started in a different version.'"
      >
        <ExclamationCircleIcon class="w-4 h-4" />
      </span>
      <span>
        {{ thread.replies.totalCount }}
        {{ thread.replies.totalCount === 1 ? 'reply' : 'replies' }}
      </span>
      <span v-tippy="createdAt.full" class="text-foreground-2 text-body-2xs">
        {{ createdAt.relative }}
      </span>
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
import { useArchiveComment } from '~~/lib/viewer/composables/commentManagement'
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
    description: `Thread ${props.thread.archived ? 'reopened.' : 'resolved.'}`,
    type: ToastNotificationType.Info
  })
}
</script>

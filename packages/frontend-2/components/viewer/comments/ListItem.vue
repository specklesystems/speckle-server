<template>
  <div
    class="py-2 my-2 flex flex-col bg-foundation hover:shadow-lg xxdark:hover:bg-foundation-3 hover:bg-primary-muted px-1 rounded-lg transition cursor-pointer"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <a @click="open(thread.id)">
      <div class="flex items-center mb-1 justify-between">
        <UserAvatarGroup :users="threadAuthors" />
      </div>

      <div class="flex items-center mb-1">
        <!-- <UserAvatar :user="thread.author" size="sm" class="mr-2" /> -->
        <span class="grow truncate text-xs font-medium text-foreground-2">
          {{ thread.author.name }}
          <span v-if="threadAuthors.length !== 1">
            & {{ thread.replyAuthors.totalCount }} others
          </span>
        </span>
        <span class="text-foreground-2 text-xs">
          {{ formattedDate }}
        </span>
      </div>
      <div class="truncate text-sm mb-1">
        {{ thread.rawText }}
      </div>
      <div
        :class="`text-xs font-bold ${
          thread.replies.totalCount > 0 ? 'text-primary' : 'text-foreground-2'
        } mb-1`"
      >
        {{ thread.replies.totalCount }}
        {{ thread.replies.totalCount === 1 ? 'reply' : 'replies' }}
      </div>
      <!-- <div class="text-xs mt-1">
      [Archived: {{ thread.archived }}] [Is resource loaded in viewer:
      {{ isThreadResourceLoaded ? 'yes' : 'no' }}] [author count:
      {{ thread.replyAuthors.totalCount }}]
    </div> -->
    </a>
  </div>
</template>
<script setup lang="ts">
import {
  LoadedCommentThread,
  useInjectedViewerInterfaceState,
  useInjectedViewerLoadedResources
} from '~~/lib/viewer/composables/setup'
import dayjs from 'dayjs'
import { ResourceType } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  thread: LoadedCommentThread
}>()

const { resourceItems } = useInjectedViewerLoadedResources()
const {
  threads: { open }
} = useInjectedViewerInterfaceState()

const formattedDate = computed(() => dayjs(props.thread.createdAt).from(dayjs()))
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

const threadAuthors = computed(() => {
  const authors = [props.thread.author]
  for (const author of props.thread.replyAuthors.items) {
    if (!authors.find((u) => u.id === author.id)) authors.push(author)
  }
  return authors
})
</script>

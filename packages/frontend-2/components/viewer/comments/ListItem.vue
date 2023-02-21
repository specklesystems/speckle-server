<template>
  <div class="py-4 flex flex-col">
    <div>// TODO: FIX thread.archived not updating from setup.ts cache update</div>
    <div class="flex items-center mb-1">
      <UserAvatar :user="thread.author" size="sm" class="mr-2" />
      <span class="grow truncate text-sm font-medium">
        {{ thread.author.name }}
      </span>
      <span class="text-foreground-2 text-sm">
        {{ formattedDate }}
      </span>
    </div>
    <div class="truncate text-sm text-foreground-2">
      {{ thread.rawText }}
    </div>
    <div class="text-xs mt-1">
      [Archived: {{ thread.archived }}] [Is resource loaded in viewer:
      {{ isThreadResourceLoaded ? 'yes' : 'no' }}]
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  LoadedCommentThread,
  useInjectedViewerLoadedResources
} from '~~/lib/viewer/composables/setup'
import dayjs from 'dayjs'
import { ResourceType } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  thread: LoadedCommentThread
}>()

const { resourceItems } = useInjectedViewerLoadedResources()

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
</script>

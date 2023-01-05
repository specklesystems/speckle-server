<template>
  <div class="space-y-2 hover:bg-primary-muted transition p-1">
    <div class="space-x-2">
      <div
        v-if="isCurrent"
        class="inline-block rounded-full px-2 text-xs bg-foundation-focus text-primary font-bold"
      >
        Current version
      </div>
      <div class="inline-block rounded-full px-2 text-xs bg- text-primary font-bold">
        {{ version.sourceApplication }}
      </div>
    </div>
    <div class="text-xs text-foreground-2">{{ createdAt }} // {{ isCurrent }}</div>
    <div class="flex items-center space-x-2">
      <UserAvatar :user="author" size="sm" />
      <span class="font-sm font-semibold">{{ author.name }}</span>
    </div>
    <div class="font-sm text-foreground-2">
      {{ version.message || 'no description' }}
    </div>
    <div class="w-20 h-20 shadow-md rounded-md">
      <PreviewImage :preview-url="previewUrl" />
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { ComputedRef } from 'vue'
import { ModelCardVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { getPreviewUrl } from '~~/lib/viewer/helpers'

const props = defineProps<{
  version: ModelCardVersionFragment
}>()

const currentVersion = inject('currentVersion') as ComputedRef<ModelCardVersionFragment>
const projectId = inject('projectId') as string

const isCurrent = computed(() => currentVersion.value.id === props.version.id)

const author = computed(() => {
  return {
    id: props.version.authorId as string,
    avatar: props.version.authorAvatar,
    name: props.version.authorName as string
  }
})

const createdAt = computed(() =>
  dayjs(props.version.createdAt as string).format('DD MMM YY, h:mm A')
)

const previewUrl = computed(() =>
  getPreviewUrl(projectId, props.version.referencedObject)
)
</script>

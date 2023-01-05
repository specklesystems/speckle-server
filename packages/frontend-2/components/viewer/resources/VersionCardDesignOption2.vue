<template>
  <button
    :class="`group block w-full transition text-left rounded-md p-1 ${
      clickable ? 'hover:bg-primary-muted' : 'cursor-default'
    }`"
    @click="handleClick"
  >
    <div class="flex items-center space-x-2">
      <div class="bg-foundation w-24 h-24 shadow rounded-md">
        <ViewerResourcesPreviewImage :preview-url="previewUrl" />
      </div>
      <div class="flex flex-col space-y-1">
        <div class="space-x-1">
          <div
            v-if="isLoaded && showMetadata"
            class="inline-block rounded-full px-2 text-xs bg-primary text-foreground-on-primary font-bold"
          >
            Loaded
          </div>
          <div
            v-if="isLatest && showMetadata"
            class="inline-block rounded-full px-2 text-xs bg-foundation-focus xxxtext-foreground-on-primary font-bold"
          >
            Latest
          </div>
          <div class="inline-block rounded-full px-1 text-xs text-primary font-bold">
            {{ version.sourceApplication }}
          </div>
        </div>
        <div class="flex items-center space-x-2 overflow-hidden">
          <UserAvatar :user="author" size="sm" />
          <span class="text-sm font-bold tracking-tight text-foreground">
            {{ author.name }}
          </span>
        </div>
        <div class="text-xs text-foreground-2">{{ createdAt }}</div>
        <div class="text-xs text-foreground-2 hidden">
          {{ timeAgoCreatedAt }}
        </div>
        <div class="text-xs text-foreground-2 truncate break-all">
          {{ version.message || 'no description' }}
        </div>
      </div>
    </div>
  </button>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { ComputedRef } from 'vue'
import { ModelCardVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { getPreviewUrl } from '~~/lib/viewer/helpers'

const props = withDefaults(
  defineProps<{
    version: ModelCardVersionFragment
    showMetadata: boolean
    clickable: boolean
  }>(),
  {
    showMetadata: true,
    clickable: true
  }
)

const emit = defineEmits<{
  (e: 'changeVersion', version: string): void
}>()

const loadedVersion = inject('loadedVersion') as ComputedRef<ModelCardVersionFragment>
const latestVersion = inject('latestVersion') as ComputedRef<ModelCardVersionFragment>
const projectId = inject('projectId') as string

const isLoaded = computed(() => loadedVersion.value.id === props.version.id)
const isLatest = computed(() => latestVersion.value.id === props.version.id)

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

const timeAgoCreatedAt = computed(() =>
  dayjs(props.version.createdAt as string).from(dayjs())
)

const previewUrl = computed(() =>
  getPreviewUrl(projectId, props.version.referencedObject)
)

function handleClick() {
  if (props.clickable) emit('changeVersion', props.version.id)
}
</script>

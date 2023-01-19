<template>
  <button
    :class="`relative group block space-y-2 w-full transition text-left pb-2 rounded-md ${
      clickable ? 'hover:bg-primary-muted' : 'cursor-default'
    }`"
    @click="handleClick"
  >
    <!-- Timeline left border -->
    <div
      v-if="!isLoadedVersion"
      class="absolute w-1 h-[99%] top-3 border-l-2 border-outline-3 left-[7px] z-10"
    ></div>
    <div class="pl-1 flex items-center space-x-2">
      <!-- Timeline circle -->
      <div class="w-2 h-2 rounded-full bg-outline-3"></div>
      <div
        class="inline-block rounded-full px-2 text-xs bg-foundation-focus xxxtext-foreground-on-primary font-bold"
      >
        <span>
          {{ isLatest ? 'Latest' : timeAgoCreatedAt }}
        </span>
      </div>
      <div
        v-if="isLoaded"
        class="inline-block rounded-full px-2 text-xs bg-primary text-foreground-on-primary font-bold"
      >
        Currently Viewing
      </div>
    </div>
    <!-- Main stuff -->
    <div class="pl-5 flex space-x-1 items-center">
      <div class="bg-foundation w-20 h-20 shadow rounded-md flex-shrink-0">
        <PreviewImage :preview-url="previewUrl" />
      </div>
      <div class="flex flex-col space-y-1 overflow-hidden">
        <div class="flex items-center space-x-1 min-w-0">
          <UserAvatar :user="author" size="sm" />
          <div class="text-xs truncate">
            {{ version.message || 'no message' }}
          </div>
        </div>
        <div class="inline-block pl-1 rounded-full text-xs text-primary font-bold">
          {{ version.sourceApplication }}
        </div>
      </div>
    </div>
  </button>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useGetPreviewUrl } from '~~/lib/viewer/helpers'
const getPreviewUrl = useGetPreviewUrl()

const props = withDefaults(
  defineProps<{
    version: ViewerModelVersionCardItemFragment
    showMetadata: boolean
    clickable: boolean
    isLatestVersion: boolean
    isLoadedVersion: boolean
  }>(),
  {
    showMetadata: true,
    clickable: true,
    default: false
  }
)

const emit = defineEmits<{
  (e: 'changeVersion', version: string): void
}>()

const { projectId } = useInjectedViewerState()

const isLoaded = computed(() => props.isLoadedVersion)
const isLatest = computed(() => props.isLatestVersion)

const author = computed(() => props.version.authorUser)

const timeAgoCreatedAt = computed(() =>
  dayjs(props.version.createdAt as string).from(dayjs())
)

const previewUrl = computed(() =>
  getPreviewUrl(projectId.value, props.version.referencedObject)
)

function handleClick() {
  if (props.clickable) emit('changeVersion', props.version.id)
}
</script>

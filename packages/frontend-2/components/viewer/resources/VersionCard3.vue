<template>
  <button
    :class="`bg-foundation group relative block w-full space-y-2 rounded-md pb-2 text-left transition ${
      clickable ? 'hover:bg-primary-muted' : 'cursor-default'
    }
    ${!showTimeline ? 'bg-primary-muted' : ''}`"
    @click="handleClick"
  >
    <!-- Timeline left border -->
    <div
      v-if="showTimeline && !last"
      :class="`absolute top-3 ml-[2px] h-[99%] w-1 border-dashed ${
        isLoaded ? 'border-primary border-r-2' : 'border-outline-3 border-r-2'
      } group-hover:border-primary left-[7px] z-10 transition-all`"
    ></div>
    <div class="flex items-center space-x-2 pl-1">
      <div class="z-20 -ml-2">
        <UserAvatar :user="author" />
      </div>
      <div
        v-show="showTimeline"
        v-tippy="`${createdAt}`"
        class="bg-foundation-focus inline-block rounded-full px-2 text-xs font-bold"
      >
        <span>
          {{ isLatest ? 'Latest' : timeAgoCreatedAt }}
        </span>
      </div>
    </div>
    <!-- Main stuff -->
    <div class="flex items-center space-x-1 pl-5">
      <div class="bg-foundation h-16 w-16 flex-shrink-0 rounded-md shadow">
        <PreviewImage :preview-url="version.previewUrl" />
      </div>
      <div class="flex flex-col space-y-1 overflow-hidden">
        <div class="flex min-w-0 items-center space-x-1">
          <div class="truncate text-xs">
            {{ version.message || 'no message' }}
          </div>
        </div>
        <div class="text-primary inline-block rounded-full pl-1 text-xs font-bold">
          {{ version.sourceApplication }}
        </div>
      </div>
    </div>
  </button>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'

const props = withDefaults(
  defineProps<{
    version: ViewerModelVersionCardItemFragment
    showMetadata: boolean
    clickable: boolean
    isLatestVersion: boolean
    isLoadedVersion: boolean
    showTimeline: boolean
    last: boolean
  }>(),
  {
    showMetadata: true,
    clickable: true,
    default: false,
    showTimeline: true,
    last: false
  }
)

const emit = defineEmits<{
  (e: 'changeVersion', version: string): void
}>()

const isLoaded = computed(() => props.isLoadedVersion)
const isLatest = computed(() => props.isLatestVersion)

const author = computed(() => props.version.authorUser)

const timeAgoCreatedAt = computed(() =>
  dayjs(props.version.createdAt as string).from(dayjs())
)
const createdAt = computed(() => {
  return dayjs(props.version.createdAt)
})

function handleClick() {
  if (props.clickable) emit('changeVersion', props.version.id)
}
</script>

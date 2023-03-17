<template>
  <button
    :class="`relative group block space-y-2 w-full bg-foundation transition text-left pb-2 rounded-md ${
      clickable ? 'hover:bg-primary-muted' : 'cursor-default'
    }
    ${!showTimeline ? 'bg-primary-muted' : ''}`"
    @click="handleClick"
  >
    <!-- Timeline left border -->
    <div
      v-if="showTimeline && !last"
      :class="`absolute ml-[2px] w-1 h-[99%] top-3 border-dashed ${
        isLoaded ? 'border-primary border-r-2' : 'border-outline-3 border-r-2'
      } left-[7px] z-10 group-hover:border-primary transition-all`"
    ></div>
    <div class="pl-1 flex items-center space-x-2">
      <div class="z-20 -ml-2">
        <UserAvatar :user="author" />
      </div>
      <div
        v-show="showTimeline"
        v-tippy="`${createdAt}`"
        class="inline-block rounded-full px-2 text-xs bg-foundation-focus font-bold"
      >
        <span>
          {{ isLatest ? 'Latest' : timeAgoCreatedAt }}
        </span>
      </div>
    </div>
    <!-- Main stuff -->
    <div class="pl-5 flex space-x-1 items-center">
      <div class="bg-foundation w-16 h-16 shadow rounded-md flex-shrink-0">
        <PreviewImage :preview-url="version.previewUrl" />
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

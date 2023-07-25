<template>
  <button
    :class="`bg-foundation group relative block w-full space-y-2 rounded-md pb-2 text-left transition ${
      clickable
        ? 'hover:bg-gray-100 dark:hover:bg-gray-700'
        : ' bg-primary-muted cursor-default'
    }
    ${isLoaded ? '' : ''}
    `"
    @click="handleClick"
  >
    <!-- Timeline left border -->
    <div
      v-if="showTimeline"
      :class="`absolute top-3 ml-[2px] h-[99%] w-1 ${
        isLoaded
          ? 'border-primary border-r-4 border'
          : 'border-dashed border-outline-3 border-r-2'
      } group-hover:border-primary left-[7px] z-10 transition-all`"
    ></div>
    <div
      v-if="last"
      class="bg-primary absolute -bottom-5 ml-2 h-2 w-2 rounded-sm"
    ></div>
    <div
      v-if="lastLoaded && !last"
      class="bg-primary absolute -bottom-6 z-10 ml-[4px] flex h-4 w-4 items-center justify-center rounded-full text-foreground-on-primary"
    >
      <ChevronDownIcon class="h-3 w-3" />
    </div>
    <div class="flex items-center space-x-2 pl-1">
      <div class="z-20 -ml-2">
        <UserAvatar :user="author" />
      </div>
      <div
        v-show="showTimeline"
        v-tippy="`${createdAt}`"
        class="bg-foundation-focus inline-block rounded-full px-2 text-xs font-bold"
      >
        <span>{{ isLatest ? 'Latest' : timeAgoCreatedAt }}</span>
      </div>
      <FormButton
        v-if="!isLoaded"
        v-tippy="'Shows a summary of added, deleted and changed elements.'"
        size="xs"
        text
        class="opacity-0 group-hover:opacity-100 transition"
        @click.stop="handleViewChanges"
      >
        View Changes
      </FormButton>
      <FormButton v-else size="xs" text disabled>Currently Viewing</FormButton>
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
import { ChevronDownIcon } from '@heroicons/vue/24/solid'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'

dayjs.extend(localizedFormat)

const props = withDefaults(
  defineProps<{
    version: ViewerModelVersionCardItemFragment
    clickable?: boolean
    isLatestVersion: boolean
    isLoadedVersion: boolean
    showTimeline?: boolean
    last: boolean
    lastLoaded: boolean
  }>(),
  {
    clickable: true,
    default: false,
    showTimeline: true,
    last: false,
    lastLoaded: false
  }
)

const emit = defineEmits<{
  (e: 'changeVersion', version: string): void
  (e: 'viewChanges', version: ViewerModelVersionCardItemFragment): void
}>()

const isLoaded = computed(() => props.isLoadedVersion)
const isLatest = computed(() => props.isLatestVersion)

const author = computed(() => props.version.authorUser)

const timeAgoCreatedAt = computed(() => dayjs(props.version.createdAt).from(dayjs()))
const createdAt = computed(() => {
  return dayjs(props.version.createdAt).format('LLL')
})

const mp = useMixpanel()

const handleClick = () => {
  if (props.clickable) emit('changeVersion', props.version.id)
  mp.track('Viewer Action', {
    type: 'action',
    name: 'change-version'
  })
}

const handleViewChanges = () => {
  emit('viewChanges', props.version)
  mp.track('Viewer Action', {
    type: 'action',
    name: 'diffs',
    action: 'enable'
  })
}
</script>

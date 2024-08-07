<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    :class="`bg-foundation-2 group relative block w-full space-y-2 rounded-md pb-2 text-left ${
      clickable ? 'hover:bg-primary-muted cursor-pointer' : 'cursor-default'
    }
    ${isLoaded ? '' : ''}
    `"
    @click="handleClick"
    @keypress="keyboardClick(handleClick)"
  >
    <!-- Timeline left border -->
    <div
      v-if="showTimeline"
      :class="`absolute top-3 ml-[2px] h-[99%] w-1 ${
        isLoaded
          ? 'border-primary border-r-4 border'
          : 'border-dashed border-outline-3 border-r-2'
      } group-hover:border-primary left-[7px] z-10`"
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
    <div class="flex items-center gap-1 pl-1">
      <div class="z-20 -ml-2">
        <UserAvatar :user="author" />
      </div>
      <div
        v-show="showTimeline"
        v-tippy="createdAt.full"
        class="bg-foundation-focus inline-block rounded-full px-2 text-body-xs font-medium shrink-0"
      >
        <span>
          {{ isLatest ? 'Latest' : createdAt.relative }}
        </span>
      </div>
      <FormButton
        v-if="!isLoaded"
        v-tippy="'Shows a summary of added, deleted and changed elements.'"
        size="sm"
        text
        @click.stop="handleViewChanges"
      >
        View Changes
      </FormButton>
      <FormButton v-else size="sm" text class="cursor-not-allowed">
        Currently Viewing
      </FormButton>
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
        <div class="text-primary inline-block rounded-full pl-1 text-xs font-medium">
          {{ version.sourceApplication }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/solid'
import { keyboardClick } from '@speckle/ui-components'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import type { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'
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

const createdAt = computed(() => {
  return {
    full: formattedFullDate(props.version.createdAt),
    relative: formattedRelativeDate(props.version.createdAt, { capitalize: true })
  }
})

const author = computed(() => props.version.authorUser)

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

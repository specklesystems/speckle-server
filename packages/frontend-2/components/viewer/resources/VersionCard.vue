<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    :class="`group relative block w-full space-y-2 rounded-md pb-2 text-left ${
      clickable && !isLimited
        ? 'hover:bg-primary-muted cursor-pointer'
        : 'cursor-default'
    }
    ${isLoaded ? 'bg-highlight-3' : 'bg-highlight-1'}
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
        :disabled="isLimited"
        :class="isLimited ? '!text-foreground-3 font-medium' : 'font-medium'"
        @click.stop="handleViewChanges"
      >
        View changes
      </FormButton>
      <FormButton v-else size="sm" text class="cursor-not-allowed">
        Currently viewing
      </FormButton>
    </div>
    <!-- Main stuff -->
    <div class="flex items-center space-x-1 pl-5">
      <div
        class="bg-foundation h-16 w-16 flex-shrink-0 rounded-md border border-outline-3"
        :class="isLimited ? 'diagonal-stripes' : ''"
      >
        <div v-if="isLimited" class="flex items-center justify-center w-full h-full">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-md bg-foundation border border-outline-3"
          >
            <LockClosedIcon class="h-4 w-4 text-foreground-3" />
          </div>
        </div>
        <PreviewImage v-else :preview-url="version.previewUrl" />
      </div>
      <div class="flex flex-col space-y-1 overflow-hidden">
        <div class="flex min-w-0 items-center space-x-1">
          <div
            v-if="isLimited"
            class="text-body-3xs text-foreground-2 pr-8 select-none"
          >
            Upgrade to view versions older than the {{ versionLimitFormatted }} limit.
          </div>
          <div v-else class="truncate text-xs">
            {{ version.message || 'no message' }}
          </div>
        </div>
        <FormButton
          v-if="isLimited"
          color="outline"
          size="sm"
          @click="handleUpgradeClick"
        >
          Upgrade
        </FormButton>
        <div
          v-else
          class="text-primary inline-block rounded-full pl-1 text-xs font-medium"
        >
          {{ version.sourceApplication }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronDownIcon, LockClosedIcon } from '@heroicons/vue/24/solid'
import { keyboardClick } from '@speckle/ui-components'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import type { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { useNavigation } from '~/lib/navigation/composables/navigation'
import { useWorkspaceLimits } from '~/lib/workspaces/composables/limits'

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

const mp = useMixpanel()
const { activeWorkspaceSlug } = useNavigation()
const { versionLimitFormatted } = useWorkspaceLimits({
  slug: computed(() => activeWorkspaceSlug.value || '')
})

const isLoaded = computed(() => props.isLoadedVersion)
const isLatest = computed(() => props.isLatestVersion)

// Check if version is limited by plan restrictions
const isLimited = computed(() => {
  return props.version.referencedObject === null
})

const createdAt = computed(() => {
  return {
    full: formattedFullDate(props.version.createdAt),
    relative: formattedRelativeDate(props.version.createdAt, { capitalize: true })
  }
})

const author = computed(() => props.version.authorUser)

const handleClick = () => {
  if (isLimited.value) return
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

const handleUpgradeClick = () => {
  mp.track('Hidden Version Upgrade Button Clicked', {
    location: 'viewer',
    // eslint-disable-next-line camelcase
    workspace_id: activeWorkspaceSlug.value
  })
  navigateTo(settingsWorkspaceRoutes.billing.route(activeWorkspaceSlug.value || ''))
}
</script>

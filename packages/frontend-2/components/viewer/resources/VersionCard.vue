<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    class="group relative w-full rounded-md pb-2 text-left pl-5"
    :class="
      clickable && !isLimited ? 'hover:bg-highlight-1 cursor-pointer' : 'cursor-default'
    "
    @click="handleClick"
    @keypress="keyboardClick(handleClick)"
  >
    <!-- Timeline left border -->
    <div
      v-if="showTimeline"
      class="absolute top-3 left-4 z-10 ml-[2px] h-[99%] w-1 border-l border-outline-3"
    >
      <div
        v-if="isLoaded"
        class="absolute -top-1.5 -left-2 flex items-center justify-center h-4 w-4 bg-foundation-2 rounded-full"
      >
        <IconCheck class="h-4 w-4 text-foreground" />
      </div>
      <div
        v-else
        class="absolute top-0 -left-[2px] h-[3px] w-[3px] bg-foreground rounded-full"
      />
      <div
        v-if="last"
        class="absolute bottom-0 -left-[2px] h-[3px] w-[3px] bg-foreground rounded-full"
      />
    </div>

    <div class="flex items-center gap-1">
      <div
        v-show="showTimeline"
        v-tippy="createdAt.full"
        class="rounded-full px-2 text-body-xs font-medium ml-2.5"
      >
        <span>
          {{ isLatest ? 'Latest' : createdAt.relative }}
        </span>
      </div>
      <CommonBadge v-if="isLoaded" rounded>Viewing</CommonBadge>
      <LayoutMenu
        v-model:open="showActionsMenu"
        class="ml-auto mr-2 mt-1"
        :items="actionsItems"
        :menu-position="HorizontalDirection.Left"
        mount-menu-on-body
        @click.stop.prevent
        @chosen="onActionChosen"
      >
        <FormButton
          color="subtle"
          class="opacity-0 group-hover:opacity-100"
          hide-text
          size="sm"
          :icon-right="EllipsisHorizontalIcon"
          @click.stop="showActionsMenu = !showActionsMenu"
        />
      </LayoutMenu>
    </div>
    <!-- Main stuff -->
    <div class="flex items-center space-x-1 pl-5">
      <div
        class="bg-foundation h-12 w-12 flex-shrink-0 rounded-md border border-outline-3"
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
          <ViewerResourcesLimitAlert
            v-if="isLimited"
            limit-type="version"
            variant="inline"
            :project="project"
          />
          <div v-else class="truncate">
            <div v-if="author" class="text-body-2xs">
              {{ author.name }}
            </div>
            <div class="text-body-3xs text-foreground-2">
              {{ version.message || 'no message' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { LockClosedIcon, EllipsisHorizontalIcon } from '@heroicons/vue/24/solid'
import { CommonBadge, keyboardClick } from '@speckle/ui-components'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import type { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { HorizontalDirection } from '~~/lib/common/composables/window'
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
    modelId?: string
    totalVersions?: number
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
  (e: 'removeVersion', versionId: string): void
}>()

const mp = useMixpanel()
const {
  resources: {
    response: { project }
  }
} = useInjectedViewerState()

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

const IconCheck = resolveComponent('IconCheck')
const showActionsMenu = ref(false)

const canDeleteVersion = computed(() => {
  if (isLoaded.value) return false
  if (props.totalVersions && props.totalVersions <= 1) return false
  return true
})

const deleteDisabledReason = computed(() => {
  if (isLoaded.value) {
    return 'Cannot delete the currently viewed version'
  }
  if (props.totalVersions && props.totalVersions <= 1) {
    return 'Cannot delete the last version'
  }
  return undefined
})

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'View changes',
      id: 'view-changes',
      disabled: isLoaded.value || isLimited.value,
      disabledTooltip: isLoaded.value
        ? 'Cannot compare current version with itself'
        : isLimited.value
        ? 'Version comparison unavailable'
        : undefined
    },
    {
      title: 'Remove version',
      id: 'remove-version',
      disabled: !canDeleteVersion.value,
      disabledTooltip: deleteDisabledReason.value
    }
  ]
])

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

const onActionChosen = (params: { item: LayoutMenuItem }) => {
  const { item } = params

  switch (item.id) {
    case 'view-changes':
      if (!isLoaded.value && !isLimited.value) {
        handleViewChanges()
      }
      break
    case 'remove-version':
      if (canDeleteVersion.value) {
        emit('removeVersion', props.version.id)
      }
      break
  }
}
</script>

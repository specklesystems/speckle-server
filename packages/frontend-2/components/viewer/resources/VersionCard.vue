<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    class="group relative w-full rounded-md text-left pl-5 pt-1 pb-2"
    :class="
      clickable && !isLimited ? 'hover:bg-highlight-1 cursor-pointer' : 'cursor-default'
    "
    @click="handleClick"
    @keypress="keyboardClick(handleClick)"
  >
    <!-- Timeline left border -->
    <div
      v-if="showTimeline"
      class="absolute top-4 left-4 z-10 ml-[2px] mt-[2px] w-1 border-l border-outline-3"
      :class="last ? 'h-0' : 'h-[99%]'"
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
    </div>

    <div class="flex items-center gap-1">
      <div
        v-show="showTimeline"
        v-tippy="createdAt.full"
        class="rounded-full px-2 text-body-xs font-medium ml-3"
      >
        <span>
          {{ isLatest ? 'Latest' : createdAt.relative }}
        </span>
      </div>
      <CommonBadge v-if="isLoaded" rounded>Viewing</CommonBadge>
      <div class="ml-auto mr-2 mt-0.5">
        <LayoutMenu
          v-model:open="showActionsMenu"
          :items="actionsItems"
          :menu-position="HorizontalDirection.Left"
          mount-menu-on-body
          @click.stop.prevent
          @chosen="onActionChosen"
        >
          <FormButton
            hide-text
            color="subtle"
            :icon-left="Ellipsis"
            size="sm"
            @click.stop="showActionsMenu = !showActionsMenu"
          >
            Menu
          </FormButton>
        </LayoutMenu>
      </div>
    </div>
    <!-- Main stuff -->
    <div class="flex items-center pl-5 gap-2 mt-1">
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
          <div v-else class="truncate pr-2">
            <div v-if="author" class="text-body-2xs truncate">
              {{ author.name }}
            </div>
            <div class="text-body-3xs text-foreground-2 truncate">
              {{ version.message || 'no message' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { LockClosedIcon } from '@heroicons/vue/24/solid'
import { CommonBadge, keyboardClick } from '@speckle/ui-components'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import type { ViewerModelVersionCardItemFragment } from '~~/lib/common/generated/gql/graphql'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useCopyModelLink } from '~/lib/projects/composables/modelManagement'
import { Ellipsis } from 'lucide-vue-next'

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
const copyModelLink = useCopyModelLink()

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
      title: 'Copy link to version',
      id: 'copy-link-to-version',
      disabled: isLimited.value,
      disabledTooltip: isLimited.value ? 'Outside workspace version limits' : undefined
    }
  ],
  [
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
    case 'copy-link-to-version':
      if (project.value?.id && props.modelId) {
        copyModelLink(project.value.id, props.modelId, props.version.id)
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

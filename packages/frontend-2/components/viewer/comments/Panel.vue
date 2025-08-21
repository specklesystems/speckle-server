<template>
  <ViewerLayoutSidePanel>
    <template #title>
      <span>Discussions</span>
    </template>
    <template #actions>
      <div class="flex items-center leading-none">
        <LayoutMenu
          v-model:open="showVisibilityOptions"
          :menu-id="menuId"
          :items="actionsItems"
          :menu-position="HorizontalDirection.Right"
          mount-menu-on-body
          :custom-menu-items-classes="['!w-[270px]']"
          show-ticks
          @click.stop.prevent
          @chosen="onActionChosen"
        >
          <FormButton
            hide-text
            color="subtle"
            :icon-left="settingsIcon"
            size="sm"
            :class="
              showVisibilityOptions
                ? '!text-primary-focus !dark:text-foreground-on-primary !bg-info-lighter'
                : ''
            "
            @click="showVisibilityOptions = !showVisibilityOptions"
          />
        </LayoutMenu>
      </div>
    </template>
    <div class="flex flex-col h-full">
      <div class="flex flex-col flex-1 gap-y-2 p-1">
        <ViewerCommentsListItem
          v-for="thread in commentThreads"
          :key="thread.id"
          :thread="thread"
        />
        <ProjectPageLatestItemsCommentsEmptyState v-if="commentThreads.length === 0" />
      </div>
    </div>
  </ViewerLayoutSidePanel>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ConcreteComponent } from 'vue'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'
import { useMixpanel } from '~~/lib/core/composables/mp'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { HorizontalDirection } from '~~/lib/common/composables/window'

enum ActionTypes {
  HideBubbles = 'hide-bubbles',
  IncludeArchived = 'include-archived',
  LoadedVersionsOnly = 'loaded-versions-only'
}

graphql(`
  fragment ViewerCommentsListItem on Comment {
    id
    rawText
    archived
    author {
      ...LimitedUserAvatar
    }
    createdAt
    viewedAt
    replies {
      totalCount
      cursor
      items {
        ...ViewerCommentsReplyItem
      }
    }
    replyAuthors(limit: 4) {
      totalCount
      items {
        ...FormUsersSelectItem
      }
    }
    resources {
      resourceId
      resourceType
    }
  }
`)

const { commentThreads, commentThreadsMetadata } = useInjectedViewerLoadedResources()
const { threadFilters } = useInjectedViewerRequestedResources()
const {
  threads: { hideBubbles }
} = useInjectedViewerInterfaceState()
const menuId = useId()

const showVisibilityOptions = ref(false)
const settingsIcon = resolveComponent('IconViewerSettings') as ConcreteComponent

const loadedVersionsOnly = computed({
  get: () =>
    threadFilters.value.loadedVersionsOnly || false ? 'loadedVersionsOnly' : undefined,
  set: (newVal) => (threadFilters.value.loadedVersionsOnly = !!newVal)
})

const includeArchived = computed({
  get: () =>
    threadFilters.value.includeArchived || false ? 'includeArchived' : undefined,
  set: (newVal) => (threadFilters.value.includeArchived = !!newVal)
})

const mp = useMixpanel()
watch(loadedVersionsOnly, (newVal) =>
  mp.track('Comment Action', {
    type: 'action',
    name: 'settings-change',
    loadedVersionsOnly: newVal
  })
)
watch(includeArchived, (newVal) =>
  mp.track('Comment Action', {
    type: 'action',
    name: 'settings-change',
    includeArchived: newVal
  })
)
watch(includeArchived, (newVal) =>
  mp.track('Comment Action', {
    type: 'action',
    name: 'settings-change',
    includeArchived: newVal
  })
)

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Show in 3D model',
      id: ActionTypes.HideBubbles,
      active: !hideBubbles.value
    },
    {
      title: `Show resolved (${commentThreadsMetadata.value?.totalArchivedCount || 0})`,
      id: ActionTypes.IncludeArchived,
      active: !!includeArchived.value
    },
    {
      title: 'Exclude threads from other versions',
      id: ActionTypes.LoadedVersionsOnly,
      active: !!loadedVersionsOnly.value
    }
  ]
])

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.HideBubbles:
      hideBubbles.value = !hideBubbles.value
      break
    case ActionTypes.IncludeArchived:
      includeArchived.value = includeArchived.value ? undefined : 'includeArchived'
      break
    case ActionTypes.LoadedVersionsOnly:
      loadedVersionsOnly.value = loadedVersionsOnly.value
        ? undefined
        : 'loadedVersionsOnly'
      break
  }
}
</script>

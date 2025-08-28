<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div v-keyboard-clickable :class="wrapperClasses" :view-id="view.id" @click="apply">
    <div class="flex items-center shrink-0">
      <div class="relative">
        <img
          :src="view.screenshot"
          alt="View screenshot"
          class="w-20 h-[60px] object-cover rounded border border-outline-3 bg-foundation-page cursor-pointer"
        />
        <div
          v-if="isHomeView && !isFederatedView"
          class="absolute -top-1 -left-1 bg-orange-500 w-4 h-4 flex items-center justify-center rounded-[3px]"
        >
          <Bookmark class="text-white w-3 h-3" fill="currentColor" stroke-width="0" />
        </div>
      </div>
    </div>
    <div class="flex flex-col min-w-0 grow">
      <div class="text-body-2xs font-medium text-foreground truncate grow-0 pr-1.5">
        {{ view.name }}
      </div>
      <div class="flex gap-1 items-center justify-between">
        <div class="text-body-2xs text-foreground-3 truncate">
          {{ view.author?.name }}
        </div>
        <div class="flex gap-0.5 items-center" @click.stop>
          <LayoutMenu
            v-model:open="showMenu"
            :items="menuItems"
            :menu-id="menuId"
            mount-menu-on-body
            show-ticks="right"
            :size="230"
            class="shrink-0 opacity-0 group-hover:opacity-100"
            @chosen="({ item: actionItem }) => onActionChosen(actionItem)"
          >
            <FormButton
              size="sm"
              color="subtle"
              :icon-left="Ellipsis"
              hide-text
              name="viewActions"
              class="shrink-0"
              @click="showMenu = !showMenu"
            />
          </LayoutMenu>
          <div
            v-tippy="canUpdate?.errorMessage"
            class="shrink-0 opacity-0 group-hover:opacity-100"
          >
            <FormButton
              size="sm"
              color="subtle"
              :icon-left="SquarePen"
              hide-text
              name="editView"
              class="shrink-0"
              :disabled="!canUpdate?.authorized || isLoading"
              @click="onEdit"
            />
          </div>
        </div>
      </div>
      <div class="w-full flex items-center gap-1">
        <Component
          :is="isOnlyVisibleToMe ? User : Globe"
          :size="12"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
          class="w-3 h-3 text-foreground-2"
        />
        <div
          v-tippy="{
            content: formattedFullDate(view.updatedAt),
            delay: [700, 100],
            duration: [120, 150],
            offset: [0, 2],
            placement: 'right'
          }"
          class="text-body-2xs text-foreground-3 truncate pr-1.5"
        >
          {{ formattedRelativeDate(view.updatedAt) }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  StringEnum,
  throwUncoveredError,
  type Optional,
  type StringEnumValues
} from '@speckle/shared'
import type { LayoutMenuItem } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
import { difference } from 'lodash-es'
import { Ellipsis, SquarePen, Bookmark, Globe, User } from 'lucide-vue-next'
import { graphql } from '~/lib/common/generated/gql'
import {
  SavedViewVisibility,
  type ViewerSavedViewsPanelView_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import { useViewerSavedViewsUtils } from '~/lib/viewer/composables/savedViews/general'
import {
  useCollectNewSavedViewViewerData,
  useUpdateSavedView
} from '~/lib/viewer/composables/savedViews/management'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

const MenuItems = StringEnum([
  'Delete',
  'LoadOriginalVersions',
  'CopyLink',
  'ChangeVisibility',
  'ReplaceView',
  'MoveToGroup',
  'SetAsHomeView'
])
type MenuItems = StringEnumValues<typeof MenuItems>

graphql(`
  fragment ViewerSavedViewsPanelView_SavedView on SavedView {
    id
    name
    description
    screenshot
    visibility
    isHomeView
    resourceIds
    author {
      id
      name
    }
    updatedAt
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
    }
    ...UseDeleteSavedView_SavedView
    ...UseUpdateSavedView_SavedView
    ...ViewerSavedViewsPanelViewEditDialog_SavedView
  }
`)

const props = defineProps<{
  view: ViewerSavedViewsPanelView_SavedViewFragment
}>()

const {
  resources: {
    response: { savedView, isFederatedView, resourceItemsIds }
  }
} = useInjectedViewerState()
const { collect } = useCollectNewSavedViewViewerData()
const updateView = useUpdateSavedView()
const isLoading = useMutationLoading()
const { copyLink, applyView } = useViewerSavedViewsUtils()
const eventBus = useEventBus()
const { formattedRelativeDate, formattedFullDate } = useDateFormatters()

const showMenu = ref(false)
const menuId = useId()

const canUpdate = computed(() => props.view.permissions.canUpdate)
const isOnlyVisibleToMe = computed(
  () => props.view.visibility === SavedViewVisibility.AuthorOnly
)
const isHomeView = computed(() => props.view.isHomeView)
const isActive = computed(() => props.view.id === savedView.value?.id)

const isOriginalVersionAlreadyLoaded = computed(() => {
  const viewResources = props.view.resourceIds
  const currentlyLoadedResources = resourceItemsIds.value
  return difference(viewResources, currentlyLoadedResources).length === 0
})

const canLoadOriginal = computed(
  (): { authorized: boolean; message: Optional<string> } => {
    if (isOriginalVersionAlreadyLoaded.value) {
      return { authorized: false, message: 'Original version is already loaded' }
    }

    return { authorized: true, message: undefined }
  }
)

const canSetHomeView = computed(
  (): { authorized: boolean; message: Optional<string> } => {
    if (!canUpdate.value?.authorized || isLoading.value) {
      return { authorized: false, message: canUpdate.value.errorMessage || undefined }
    }

    if (isFederatedView.value) {
      return {
        authorized: false,
        message: "Home view settings can't be updated while in a federated view"
      }
    }

    if (isOnlyVisibleToMe.value) {
      return {
        authorized: false,
        message: 'A view must be shared to be set as home view'
      }
    }

    return { authorized: true, message: undefined }
  }
)
const menuItems = computed((): LayoutMenuItem<MenuItems>[][] => [
  [
    {
      id: MenuItems.LoadOriginalVersions,
      title: 'Load with original model version',
      disabled: !canLoadOriginal.value.authorized || isLoading.value,
      disabledTooltip: canLoadOriginal.value.message
    },
    {
      id: MenuItems.ReplaceView,
      title: 'Replace view',
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value.errorMessage
    },
    {
      id: MenuItems.MoveToGroup,
      title: 'Move to group',
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value.errorMessage
    },
    {
      id: MenuItems.CopyLink,
      title: 'Copy link'
    }
  ],
  [
    {
      id: MenuItems.SetAsHomeView,
      title: 'Set as home view',
      active: !!isHomeView.value,
      disabled: !canSetHomeView.value.authorized,
      disabledTooltip: canSetHomeView.value.message
    },
    {
      id: MenuItems.ChangeVisibility,
      title: isOnlyVisibleToMe.value ? 'Make view shared' : 'Make view private',
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value.errorMessage
    }
  ],
  [
    {
      id: MenuItems.Delete,
      title: 'Delete',
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value.errorMessage
    }
  ]
])

const wrapperClasses = computed(() => {
  const classParts = ['flex gap-2 p-2 pr-0.5 w-full group rounded-md cursor-pointer']

  if (isActive.value) {
    classParts.push('bg-highlight-2 hover:bg-highlight-3')
  } else {
    classParts.push('hover:bg-highlight-1')
  }

  return classParts.join(' ')
})

const onActionChosen = async (item: LayoutMenuItem<MenuItems>) => {
  switch (item.id) {
    case MenuItems.Delete:
      eventBus.emit(ViewerEventBusKeys.MarkSavedViewForEdit, {
        type: 'delete',
        view: props.view
      })
      break
    case MenuItems.CopyLink:
      await copyLink({
        settings: {
          id: props.view.id
        }
      })
      break
    case MenuItems.LoadOriginalVersions:
      applyView({
        id: props.view.id,
        loadOriginal: true
      })
      break
    case MenuItems.ChangeVisibility:
      await updateView({
        view: props.view,
        input: {
          id: props.view.id,
          projectId: props.view.projectId,
          visibility: isOnlyVisibleToMe.value
            ? SavedViewVisibility.Public
            : SavedViewVisibility.AuthorOnly
        }
      })
      break
    case MenuItems.ReplaceView:
      // Replace view w/ active one
      await updateView({
        view: props.view,
        input: {
          id: props.view.id,
          ...(await collect())
        }
      })
      break
    case MenuItems.MoveToGroup:
      eventBus.emit(ViewerEventBusKeys.MarkSavedViewForEdit, {
        type: 'move',
        view: props.view
      })
      break
    case MenuItems.SetAsHomeView:
      await updateView({
        view: props.view,
        input: {
          id: props.view.id,
          projectId: props.view.projectId,
          isHomeView: !isHomeView.value
        }
      })
      break
    default:
      throwUncoveredError(item.id)
  }
}

const apply = async () => {
  applyView({
    id: props.view.id
  })
}

const onEdit = () => {
  eventBus.emit(ViewerEventBusKeys.MarkSavedViewForEdit, {
    type: 'edit',
    view: props.view
  })
}
</script>

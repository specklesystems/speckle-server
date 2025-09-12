<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    v-keyboard-clickable
    :class="[wrapperClasses, draggableClasses]"
    :view-id="view.id"
    draggable="true"
    v-on="on"
    @click="apply"
  >
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
          <svg
            class="w-3 h-3"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.6112 1.10845C5.88906 0.939851 6.25219 0.96782 6.50183 1.19244L11.5018 5.69244C11.8097 5.96954 11.8346 6.44414 11.5575 6.75201C11.2808 7.05933 10.8078 7.0843 10.4999 6.80865V10.0001C10.4999 10.4143 10.1641 10.7501 9.74988 10.7501H8.24988C7.83574 10.75 7.49988 10.4142 7.49988 10.0001V7.25006C7.49984 6.97394 7.276 6.75006 6.99988 6.75006H4.99988C4.72383 6.75015 4.49991 6.974 4.49988 7.25006V10.0001C4.49988 10.4143 4.16409 10.7501 3.74988 10.7501H2.24988C1.83574 10.75 1.49988 10.4142 1.49988 10.0001V6.80865C1.19197 7.08421 0.718883 7.05931 0.442258 6.75201C0.165257 6.44415 0.190136 5.96952 0.497923 5.69244L5.49792 1.19244L5.6112 1.10845Z"
              fill="white"
            />
          </svg>
        </div>
      </div>
    </div>
    <div class="flex flex-col min-w-0 grow">
      <div class="text-body-2xs font-medium text-foreground truncate grow-0">
        {{ view.name }}
      </div>
      <div class="text-body-2xs text-foreground-3 truncate">
        {{ view.author?.name }}
      </div>
      <div class="w-full flex items-center gap-1">
        <User
          v-if="isOnlyVisibleToMe"
          v-tippy="getTooltipProps('Only visible to you')"
          :size="12"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
          class="w-3 h-3 text-foreground-3 shrink-0"
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
          {{ formattedRelativeDate(view.updatedAt, { capitalize: true }) }}
        </div>
      </div>
    </div>
    <div
      class="flex gap-0.5 items-center opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto"
      @click.stop
    >
      <LayoutMenu
        v-model:open="showMenu"
        :items="menuItems"
        :menu-id="menuId"
        mount-menu-on-body
        show-ticks="right"
        :size="230"
        class="shrink-0"
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
        v-tippy="
          getTooltipProps(canUpdate?.authorized ? 'Edit view' : canUpdate?.errorMessage)
        "
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
import { Ellipsis, SquarePen, User } from 'lucide-vue-next'
import { graphql } from '~/lib/common/generated/gql'
import {
  SavedViewVisibility,
  type ViewerSavedViewsPanelView_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useViewerSavedViewsUtils } from '~/lib/viewer/composables/savedViews/general'
import {
  useCollectNewSavedViewViewerData,
  useUpdateSavedView
} from '~/lib/viewer/composables/savedViews/management'
import { useDraggableView } from '~/lib/viewer/composables/savedViews/ui'
import { useSavedViewValidationHelpers } from '~/lib/viewer/composables/savedViews/validation'
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

const { getTooltipProps } = useSmartTooltipDelay()

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
    ...UseSavedViewValidationHelpers_SavedView
    ...UseDraggableView_SavedView
  }
`)

const props = defineProps<{
  view: ViewerSavedViewsPanelView_SavedViewFragment
}>()

const {
  resources: {
    response: { savedView, isFederatedView, resourceItemsIds, project }
  }
} = useInjectedViewerState()
const { collect } = useCollectNewSavedViewViewerData()
const updateView = useUpdateSavedView()
const isLoading = useMutationLoading()
const { copyLink, applyView } = useViewerSavedViewsUtils()
const eventBus = useEventBus()
const { formattedRelativeDate, formattedFullDate } = useDateFormatters()
const {
  canUpdate,
  isOnlyVisibleToMe,
  canSetHomeView,
  isHomeView,
  canToggleVisibility,
  canMove
} = useSavedViewValidationHelpers({
  view: computed(() => props.view)
})
const { classes: draggableClasses, on } = useDraggableView({
  view: computed(() => props.view)
})
const mp = useMixpanel()

const showMenu = ref(false)
const menuId = useId()

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

const menuItems = computed((): LayoutMenuItem<MenuItems>[][] => [
  [
    {
      id: MenuItems.MoveToGroup,
      title: 'Move to group',
      disabled: !canMove.value?.authorized || isLoading.value,
      disabledTooltip: canMove.value?.errorMessage
    },
    {
      id: MenuItems.ReplaceView,
      title: 'Replace view',
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value?.errorMessage
    },
    {
      id: MenuItems.CopyLink,
      title: 'Copy link'
    },
    {
      id: MenuItems.LoadOriginalVersions,
      title: 'Load with original model version',
      disabled: !canLoadOriginal.value.authorized || isLoading.value,
      disabledTooltip: canLoadOriginal.value.message
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
      disabled: !canToggleVisibility.value.authorized,
      disabledTooltip: canToggleVisibility.value.message
    }
  ],
  [
    {
      id: MenuItems.Delete,
      title: 'Delete view...',
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value?.errorMessage
    }
  ]
])

const wrapperClasses = computed(() => {
  const classParts = [
    'flex items-center gap-2 p-1.5 w-full group rounded-md cursor-pointer relative transition-all'
  ]

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
      mp.track('Saved View Link Copied', {
        viewId: props.view.id,
        // eslint-disable-next-line camelcase
        workspace_id: project.value?.workspaceId
      })
      break
    case MenuItems.LoadOriginalVersions:
      applyView({
        id: props.view.id,
        loadOriginal: true
      })
      mp.track('Saved View Original Version Loaded', {
        viewId: props.view.id,
        // eslint-disable-next-line camelcase
        workspace_id: project.value?.workspaceId
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

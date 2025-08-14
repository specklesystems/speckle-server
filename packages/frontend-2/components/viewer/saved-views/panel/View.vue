<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    class="flex gap-2 p-2 w-full group hover:bg-foundation-2 rounded"
    :view-id="view.id"
  >
    <div v-keyboard-clickable class="relative cursor-pointer" @click="apply">
      <img
        :src="view.screenshot"
        alt="View screenshot"
        class="w-20 h-14 object-cover rounded border border-outline-3 bg-foundation-page cursor-pointer"
      />
      <div
        v-if="isHomeView"
        class="absolute -top-1 -left-1 bg-orange-500 w-4 h-4 flex items-center justify-center rounded-sm"
      >
        <Bookmark class="text-white w-3 h-3" fill="currentColor" />
      </div>
    </div>
    <div class="flex flex-col gap-1 min-w-0 grow">
      <div class="text-body-2xs font-medium text-foreground truncate grow-0">
        {{ view.name }}
      </div>
      <div class="flex gap-1 items-center justify-between">
        <div class="text-body-2xs text-foreground-3 truncate">
          {{ view.author?.name }}
        </div>
        <div class="flex items-center">
          <LayoutMenu
            v-model:open="showMenu"
            :items="menuItems"
            :menu-id="menuId"
            mount-menu-on-body
            show-ticks="right"
            :size="230"
            @chosen="({ item: actionItem }) => onActionChosen(actionItem)"
          >
            <FormButton
              size="sm"
              color="subtle"
              :icon-left="Ellipsis"
              hide-text
              name="viewActions"
              class="shrink-0 opacity-0 group-hover:opacity-100"
              @click="showMenu = !showMenu"
            />
          </LayoutMenu>
          <div v-tippy="canUpdate?.errorMessage">
            <FormButton
              size="sm"
              color="subtle"
              :icon-left="SquarePen"
              hide-text
              name="editView"
              class="shrink-0 opacity-0 group-hover:opacity-100"
              :disabled="!canUpdate?.authorized || isLoading"
              @click="onEdit"
            />
          </div>
        </div>
      </div>
      <div class="w-full flex">
        <div
          v-tippy="formattedFullDate(view.updatedAt)"
          class="text-body-2xs text-foreground-3 truncate"
        >
          {{ formattedRelativeDate(view.updatedAt) }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { StringEnum, throwUncoveredError, type StringEnumValues } from '@speckle/shared'
import type { LayoutMenuItem } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
import { Ellipsis, SquarePen, Bookmark } from 'lucide-vue-next'
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

const { collect } = useCollectNewSavedViewViewerData()
const updateView = useUpdateSavedView()
const isLoading = useMutationLoading()
const { copyLink, applyView } = useViewerSavedViewsUtils()
const eventBus = useEventBus()

const showMenu = ref(false)
const menuId = useId()

const canUpdate = computed(() => props.view.permissions.canUpdate)
const isOnlyVisibleToMe = computed(
  () => props.view.visibility === SavedViewVisibility.AuthorOnly
)
const isHomeView = computed(() => props.view.isHomeView)

const menuItems = computed((): LayoutMenuItem<MenuItems>[][] => [
  [
    {
      id: MenuItems.LoadOriginalVersions,
      title: 'Load with original model version'
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
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value.errorMessage
    },
    {
      id: MenuItems.ChangeVisibility,
      title: 'Only visible to me',
      active: !!isOnlyVisibleToMe.value,
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

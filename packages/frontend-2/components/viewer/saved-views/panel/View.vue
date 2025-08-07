<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    class="flex gap-2 p-2 w-full group hover:bg-foundation-2 rounded"
    :view-id="view.id"
  >
    <img
      v-keyboard-clickable
      :src="view.screenshot"
      alt="View screenshot"
      class="w-20 h-14 object-cover rounded border border-outline-3 bg-foundation-page cursor-pointer"
      @click="apply"
    />
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
              @click="showEditDialog = !showEditDialog"
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
    <ViewerSavedViewsPanelViewEditDialog v-model:open="showEditDialog" :view="view" />
  </div>
</template>
<script setup lang="ts">
import { StringEnum, throwUncoveredError, type StringEnumValues } from '@speckle/shared'
import type { LayoutMenuItem } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
import { Ellipsis, SquarePen } from 'lucide-vue-next'
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerSavedViewsPanelView_SavedViewFragment } from '~/lib/common/generated/gql/graphql'
import { useEventBus } from '~/lib/core/composables/eventBus'
import { useDeleteSavedView } from '~/lib/viewer/composables/savedViews/management'
import { ViewerEventBusKeys } from '~/lib/viewer/helpers/eventBus'

const Menuitems = StringEnum(['Delete'])
type MenuItems = StringEnumValues<typeof Menuitems>

graphql(`
  fragment ViewerSavedViewsPanelView_SavedView on SavedView {
    id
    name
    description
    screenshot
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
    ...ViewerSavedViewsPanelViewEditDialog_SavedView
  }
`)

const props = defineProps<{
  view: ViewerSavedViewsPanelView_SavedViewFragment
}>()

const eventBus = useEventBus()
const deleteView = useDeleteSavedView()
const isLoading = useMutationLoading()

const showEditDialog = ref(false)
const showMenu = ref(false)
const menuId = useId()

const canUpdate = computed(() => props.view.permissions.canUpdate)
const menuItems = computed((): LayoutMenuItem<MenuItems>[][] => [
  [
    {
      id: Menuitems.Delete,
      title: 'Delete',
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value.errorMessage
    }
  ]
])

const onActionChosen = async (item: LayoutMenuItem<MenuItems>) => {
  switch (item.id) {
    case Menuitems.Delete:
      await deleteView({ view: props.view })
      break
    default:
      throwUncoveredError(item.id)
  }
}

const apply = async () => {
  // Force update, even if the view id is already set
  // (in case this is a frustration click w/ the state not applying)
  eventBus.emit(ViewerEventBusKeys.UpdateSavedView, {
    viewId: props.view.id
  })
}
</script>

<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <LayoutDisclosure
    v-model:open="open"
    v-model:edit-title="renameMode"
    color="subtle"
    :title="group.title"
    lazy-load
    :class="dropZoneClasses"
    @update:title="onRename"
    v-on="on"
  >
    <ViewerSavedViewsPanelViewsGroupInner
      :group="group"
      :search="search"
      :views-type="viewsType"
      @view-count-updated="(count) => (viewCount = count)"
    />
    <template #title-actions>
      <div
        class="flex gap-0.5 items-center lg:group-hover/disclosure:opacity-100"
        :class="{ 'lg:opacity-0': !showMenu }"
        @click.stop
      >
        <LayoutMenu
          v-if="!isUngroupedGroup"
          v-model:open="showMenu"
          :items="menuItems"
          :menu-id="menuId"
          mount-menu-on-body
          show-ticks="right"
          @chosen="({ item: actionItem }) => onActionChosen(actionItem)"
        >
          <FormButton
            name="viewActions"
            size="sm"
            color="subtle"
            :icon-left="Ellipsis"
            hide-text
            @click="showMenu = !showMenu"
          />
        </LayoutMenu>
        <div v-if="canPresent">
          <FormButton
            v-tippy="getTooltipProps('Present')"
            size="sm"
            color="subtle"
            :icon-left="Play"
            hide-text
            name="presentGroup"
            @click="onPresentGroup"
          />
        </div>
        <div v-tippy="canCreateView?.errorMessage">
          <FormButton
            v-tippy="getTooltipProps('Create view')"
            size="sm"
            color="subtle"
            :icon-left="Plus"
            hide-text
            name="addGroupView"
            :disabled="!canCreateView.authorized || isLoading"
            @click="onAddGroupView"
          />
        </div>
      </div>
    </template>
  </LayoutDisclosure>
</template>
<script setup lang="ts">
import { StringEnum, throwUncoveredError, type StringEnumValues } from '@speckle/shared'
import type { LayoutMenuItem } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
import { Ellipsis, Plus, Play } from 'lucide-vue-next'
import { graphql } from '~/lib/common/generated/gql'
import type {
  UseUpdateSavedViewGroup_SavedViewGroupFragment,
  ViewerSavedViewsPanelViewsGroup_ProjectFragment,
  ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment,
  ViewerSavedViewsPanelViewsGroupDeleteDialog_SavedViewGroupFragment
} from '~/lib/common/generated/gql/graphql'
import { ToastNotificationType } from '~/lib/common/composables/toast'
import {
  useCreateSavedView,
  useUpdateSavedViewGroup
} from '~/lib/viewer/composables/savedViews/management'
import type { ViewsType } from '~/lib/viewer/helpers/savedViews'
import { useDraggableViewTargetGroup } from '~/lib/viewer/composables/savedViews/ui'
import { presentationRoute } from '~/lib/common/helpers/route'

const { getTooltipProps } = useSmartTooltipDelay()

const MenuItems = StringEnum(['Delete', 'Rename'])
type MenuItems = StringEnumValues<typeof MenuItems>

graphql(`
  fragment ViewerSavedViewsPanelViewsGroup_Project on Project {
    id
    permissions {
      canCreateSavedView {
        ...FullPermissionCheckResult
      }
    }
    workspace {
      id
      hasAccessToFeature(featureName: presentations)
    }
  }
`)

graphql(`
  fragment ViewerSavedViewsPanelViewsGroup_SavedViewGroup on SavedViewGroup {
    id
    isUngroupedViewsGroup
    resourceIds
    title
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
    }
    ...ViewerSavedViewsPanelViewsGroupInner_SavedViewGroup
    ...ViewerSavedViewsPanelViewsGroupDeleteDialog_SavedViewGroup
    ...UseUpdateSavedViewGroup_SavedViewGroup
    ...UseDraggableViewTargetGroup_SavedViewGroup
  }
`)

graphql(`
  fragment ViewerSavedViewsPanelViewsGroup_SavedViewGroup_Paginated on SavedViewGroup {
    id
    views(input: $savedViewsInput) {
      cursor
      totalCount
      items {
        id
        ...ViewerSavedViewsPanelView_SavedView
      }
    }
  }
`)

const emit = defineEmits<{
  'delete-group': [
    group: ViewerSavedViewsPanelViewsGroupDeleteDialog_SavedViewGroupFragment
  ]
  'rename-group': [group: UseUpdateSavedViewGroup_SavedViewGroupFragment]
}>()

const props = defineProps<{
  project: ViewerSavedViewsPanelViewsGroup_ProjectFragment
  group: ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment
  viewsType: ViewsType
  search?: string
}>()

const open = defineModel<boolean>('open')
const viewCount = ref(0)

const { triggerNotification } = useGlobalToast()
const isLoading = useMutationLoading()
const createView = useCreateSavedView()
const updateGroup = useUpdateSavedViewGroup()
const { on, classes: dropZoneClasses } = useDraggableViewTargetGroup({
  group: computed(() => props.group),
  onMoved: () => {
    // Auto-open the group if it was closed
    if (!open.value) {
      open.value = true
    }
  },
  isGroupOpen: computed(() => !!open.value),
  viewCount
})

const renameMode = defineModel<boolean>('renameMode')
const showMenu = ref(false)
const menuId = useId()

const isUngroupedGroup = computed(() => props.group.isUngroupedViewsGroup)
const canUpdate = computed(() => props.group.permissions.canUpdate)
const canCreateView = computed(() => props.project.permissions.canCreateSavedView)
const canPresent = computed(() => props.project.workspace?.hasAccessToFeature)

const menuItems = computed((): LayoutMenuItem<MenuItems>[][] => {
  const items: LayoutMenuItem<MenuItems>[][] = []

  items.push([
    {
      id: MenuItems.Rename,
      title: 'Rename group',
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value.errorMessage
    },
    {
      id: MenuItems.Delete,
      title: 'Delete group...',
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value.errorMessage
    }
  ])

  return items
})

const onActionChosen = async (item: LayoutMenuItem<MenuItems>) => {
  switch (item.id) {
    case MenuItems.Delete:
      emit('delete-group', props.group)
      break
    case MenuItems.Rename:
      emit('rename-group', props.group)
      break
    default:
      throwUncoveredError(item.id)
  }
}

const onPresentGroup = () => {
  window.open(presentationRoute(props.project.id, props.group.id), '_blank')
}

const onAddGroupView = async () => {
  await createView({
    groupId: props.group.id
  })
  open.value = true
}

const onRename = async (newName: string) => {
  if (!newName.trim() || newName.length > 255) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Name must be between 1 and 255 characters long'
    })
    renameMode.value = false
    return
  }

  if (props.group.title === newName) {
    renameMode.value = false
    return
  }

  const res = await updateGroup({
    group: props.group,
    update: {
      name: newName
    }
  })
  if (res?.id) {
    renameMode.value = false
  }
}
</script>

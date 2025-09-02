<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    :class="dropZoneClasses"
    @dragover="onDragOver"
    @drop="onDrop"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
  >
    <LayoutDisclosure
      v-if="!isUngroupedGroup"
      v-model:open="open"
      v-model:edit-title="renameMode"
      color="subtle"
      :title="group.title"
      lazy-load
      @update:title="onRename"
    >
      <ViewerSavedViewsPanelViewsGroupInner
        :group="group"
        :search="search"
        :views-type="viewsType"
      />
      <template #title-actions>
        <div
          class="flex gap-0.5 items-center opacity-0 group-hover/disclosure:opacity-100"
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
    <ViewerSavedViewsPanelViewsGroupInner
      v-else
      class="mb-[1px]"
      :group="group"
      :search="search"
      :views-type="viewsType"
    />
  </div>
</template>
<script setup lang="ts">
import { StringEnum, throwUncoveredError, type StringEnumValues } from '@speckle/shared'
import type { LayoutMenuItem } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
import { Ellipsis, Plus } from 'lucide-vue-next'
import { graphql } from '~/lib/common/generated/gql'
import type {
  UseUpdateSavedViewGroup_SavedViewGroupFragment,
  UseUpdateSavedView_SavedViewFragment,
  ViewerSavedViewsPanelViewsGroup_ProjectFragment,
  ViewerSavedViewsPanelViewsGroup_SavedViewGroupFragment,
  ViewerSavedViewsPanelViewsGroupDeleteDialog_SavedViewGroupFragment
} from '~/lib/common/generated/gql/graphql'
import { ToastNotificationType } from '~/lib/common/composables/toast'
import {
  useCreateSavedView,
  useUpdateSavedViewGroup,
  useUpdateSavedView
} from '~/lib/viewer/composables/savedViews/management'
import type { ViewsType } from '~/lib/viewer/helpers/savedViews'

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
  }
`)

graphql(`
  fragment ViewerSavedViewsPanelViewsGroup_SavedViewGroup on SavedViewGroup {
    id
    isUngroupedViewsGroup
    title
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
    }
    ...ViewerSavedViewsPanelViewsGroupInner_SavedViewGroup
    ...ViewerSavedViewsPanelViewsGroupDeleteDialog_SavedViewGroup
    ...UseUpdateSavedViewGroup_SavedViewGroup
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

const { triggerNotification } = useGlobalToast()
const isLoading = useMutationLoading()
const createView = useCreateSavedView()
const updateGroup = useUpdateSavedViewGroup()
const updateView = useUpdateSavedView()
const renameMode = defineModel<boolean>('renameMode')

const open = defineModel<boolean>('open')
const showMenu = ref(false)
const menuId = useId()

// Drag and drop state
const isDragOver = ref(false)
const dragCounter = ref(0)

const isUngroupedGroup = computed(() => props.group.isUngroupedViewsGroup)
const canUpdate = computed(() => props.group.permissions.canUpdate)
const canCreateView = computed(() => props.project.permissions.canCreateSavedView)

const menuItems = computed((): LayoutMenuItem<MenuItems>[][] => [
  [
    {
      id: MenuItems.Rename,
      title: 'Rename group',
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value.errorMessage
    }
  ],
  [
    {
      id: MenuItems.Delete,
      title: 'Delete group...',
      disabled: !canUpdate.value?.authorized || isLoading.value,
      disabledTooltip: canUpdate.value.errorMessage
    }
  ]
])

const onDragOver = (_event: DragEvent) => {
  _event.preventDefault()
  if (_event.dataTransfer) {
    _event.dataTransfer.dropEffect = 'move'
  }
}

const onDragEnter = (_event: DragEvent) => {
  _event.preventDefault()
  dragCounter.value++
  isDragOver.value = true
}

const onDragLeave = (_event: DragEvent) => {
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragOver.value = false
  }
}

const onDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  dragCounter.value = 0

  try {
    const dataTransfer = event.dataTransfer
    if (!dataTransfer) return

    const data = JSON.parse(dataTransfer.getData('application/json'))
    if (!data.viewId || data.sourceGroupId === props.group.id) {
      return // Same group, no need to move
    }

    // Move the view to this group using the enhanced drag data
    const success = await moveViewToGroup(data)

    if (success) {
      // Auto-open the group if it was closed
      if (!open.value) {
        open.value = true
      }

      triggerNotification({
        type: ToastNotificationType.Success,
        title: `Moved "${data.viewName}" to "${props.group.title}"`
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to move view'
      })
    }
  } catch {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to move view'
    })
  }
}

const moveViewToGroup = async (dragData: {
  viewId: string
  viewName: string
  sourceGroupId: string | null
  projectId: string
  isHomeView: boolean
  groupResourceIds: string[]
}): Promise<boolean> => {
  try {
    // Create a proper view object using the enhanced drag data
    const viewData: UseUpdateSavedView_SavedViewFragment = {
      id: dragData.viewId,
      projectId: dragData.projectId,
      isHomeView: dragData.isHomeView || false,
      groupResourceIds: dragData.groupResourceIds || [],
      group: { id: dragData.sourceGroupId || '' }
    }

    const result = await updateView({
      view: viewData,
      input: {
        id: dragData.viewId,
        projectId: dragData.projectId,
        groupId: isUngroupedGroup.value ? null : props.group.id
      }
    })

    return !!result?.id
  } catch {
    return false
  }
}

const dropZoneClasses = computed(() => [
  isDragOver.value && 'rounded-md ring-2 ring-primary ring-opacity-50 bg-primary/5'
])

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

<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="relative">
    <LayoutMenu
      v-model:open="showActionsMenu"
      :menu-id="menuId"
      :items="actionsItems"
      :menu-position="menuPosition ? menuPosition : HorizontalDirection.Left"
      :mount-menu-on-body="mountMenuOnBody"
      @click.stop.prevent
      @chosen="onActionChosen"
    >
      <FormButton
        color="subtle"
        hide-text
        :icon-right="EllipsisHorizontalIcon"
        class="!text-foreground-2"
        @click="onButtonClick"
      ></FormButton>
    </LayoutMenu>
    <ProjectPageModelsCardEditDialog
      v-model:open="isRenameDialogOpen"
      :model="model"
      :project-id="project.id"
      @updated="$emit('model-updated')"
    />
    <ProjectPageModelsCardDeleteDialog
      v-model:open="isDeleteDialogOpen"
      :model="model"
      :project-id="project.id"
      @deleted="$emit('model-updated')"
    />
    <ProjectModelPageDialogEmbed
      v-model:open="isEmbedDialogOpen"
      :project="project"
      :model-id="model.id"
    />
    <ProjectPageModelsUploadsDialog
      v-model:open="isUploadsDialogOpen"
      :project-id="project.id"
      :model-id="model.id"
    />
    <ProjectPageModelsCardRemoveSyncDialog
      v-if="accSyncItem"
      v-model:open="isRemoveSyncDialogOpen"
      :project-id="project.id"
      :sync-item="accSyncItem"
    />
  </div>
</template>
<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import type {
  ProjectPageModelsActionsFragment,
  ProjectPageModelsActions_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { useCopyModelLink } from '~~/lib/projects/composables/modelManagement'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/solid'
import { graphql } from '~~/lib/common/generated/gql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { modelVersionsRoute } from '~/lib/common/helpers/route'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'
import { useUpdateAccSyncItem } from '~/lib/acc/composables/useUpdateAccSyncItem'

graphql(`
  fragment ProjectPageModelsActions on Model {
    id
    name
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
      canDelete {
        ...FullPermissionCheckResult
      }
      canCreateVersion {
        ...FullPermissionCheckResult
      }
    }
    accSyncItem {
      id
      ...ProjectPageModelsActions_AccSyncItem
    }
    ...UseCopyModelLink_Model
  }
`)

graphql(`
  fragment ProjectPageModelsActions_Project on Project {
    id
    workspace {
      id
      slug
    }
    permissions {
      canReadAccIntegrationSettings {
        ...FullPermissionCheckResult
      }
    }
    ...ProjectsModelPageEmbed_Project
  }
`)

graphql(`
  fragment ProjectPageModelsActions_AccSyncItem on AccSyncItem {
    id
    accFileName
    status
  }
`)

enum ActionTypes {
  Rename = 'rename',
  Delete = 'delete',
  Share = 'share',
  ViewVersions = 'view-versions',
  UploadVersion = 'upload-version',
  ToggleSyncPause = 'toggle-sync-pause',
  DeleteSync = 'delete-sync',
  CopyId = 'copy-id',
  Embed = 'embed',
  ViewUploads = 'view-uploads'
}

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'model-updated'): void
  (e: 'upload-version'): void
  (e: 'embed'): void
}>()

const props = defineProps<{
  open?: boolean
  model: ProjectPageModelsActionsFragment
  project: ProjectPageModelsActions_ProjectFragment
  menuPosition?: HorizontalDirection
  mountMenuOnBody?: boolean
}>()

const copyModelLink = useCopyModelLink()
const { copy } = useClipboard()
const menuId = useId()
const { isLoggedIn } = useActiveUser()
const router = useRouter()
const mp = useMixpanel()
const { statusIsCanceled } = useWorkspacePlan(props.project.workspace?.slug || '')

const showActionsMenu = ref(false)
const openDialog = ref(null as Nullable<ActionTypes>)

const accSyncItem = computed(() => props.model.accSyncItem)
const updateAccSyncItem = useUpdateAccSyncItem()

const canEdit = computed(() => props.model.permissions.canUpdate)
const canDelete = computed(() => props.model.permissions.canDelete)
const canCreateVersion = computed(() => props.model.permissions.canCreateVersion)
const canEditAccSync = computed(
  () => props.project.permissions.canReadAccIntegrationSettings
)

const uploadVersionDisabled = computed(() => {
  if (canCreateVersion.value.code === 'WORKSPACES_NOT_AUTHORIZED_ERROR') {
    return {
      disabled: true,
      tooltip: `Your project role doesn't allow creating new model versions`
    }
  }
  if (statusIsCanceled.value) {
    return {
      disabled: true,
      tooltip:
        "The workspace's subscription is cancelled, so no new model versions can be created"
    }
  }
  if (!canCreateVersion.value.authorized) {
    return {
      disabled: true,
      tooltip: canCreateVersion.value.message || 'Insufficient permissions'
    }
  }

  return {
    disabled: false,
    tooltip: ''
  }
})

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  ...(isLoggedIn.value
    ? [
        [
          {
            title: 'Edit model...',
            id: ActionTypes.Rename,
            disabled: !canEdit.value.authorized,
            disabledTooltip: canEdit.value.message || 'Insufficient permissions'
          }
        ]
      ]
    : []),
  accSyncItem.value
    ? [
        {
          title:
            accSyncItem.value?.status === 'paused' ? 'Resume sync...' : 'Pause sync...',
          id: ActionTypes.ToggleSyncPause,
          disabled: !canEditAccSync.value.authorized,
          disabledTooltip: canEditAccSync.value.message
        },
        {
          title: 'Remove sync...',
          id: ActionTypes.DeleteSync,
          disabled: !canEditAccSync.value.authorized,
          disabledTooltip: canEditAccSync.value.message
        }
      ]
    : [
        {
          title: 'View versions',
          id: ActionTypes.ViewVersions
        },
        {
          title: 'View uploads',
          id: ActionTypes.ViewUploads
        },
        ...(isLoggedIn.value
          ? [
              {
                title: 'Upload new version...',
                id: ActionTypes.UploadVersion,
                disabled: uploadVersionDisabled.value.disabled,
                disabledTooltip: uploadVersionDisabled.value.tooltip
              }
            ]
          : [])
      ],
  [
    { title: 'Copy link', id: ActionTypes.Share },
    { title: 'Copy ID', id: ActionTypes.CopyId },
    { title: 'Embed model...', id: ActionTypes.Embed }
  ],
  ...(isLoggedIn.value
    ? [
        [
          {
            title: 'Delete...',
            id: ActionTypes.Delete,
            // TODO:
            disabled: !canDelete.value.authorized,
            disabledTooltip: canDelete.value.message || 'Insufficient permissions'
          }
        ]
      ]
    : [])
])

const isRenameDialogOpen = computed({
  get: () => openDialog.value === ActionTypes.Rename,
  set: (isOpen) => (openDialog.value = isOpen ? ActionTypes.Rename : null)
})
const isDeleteDialogOpen = computed({
  get: () => openDialog.value === ActionTypes.Delete,
  set: (isOpen) => (openDialog.value = isOpen ? ActionTypes.Delete : null)
})
const isEmbedDialogOpen = computed({
  get: () => openDialog.value === ActionTypes.Embed,
  set: (isOpen) => (openDialog.value = isOpen ? ActionTypes.Embed : null)
})
const isUploadsDialogOpen = computed({
  get: () => openDialog.value === ActionTypes.ViewUploads,
  set: (isOpen) => (openDialog.value = isOpen ? ActionTypes.ViewUploads : null)
})
const isRemoveSyncDialogOpen = computed({
  get: () => openDialog.value === ActionTypes.DeleteSync,
  set: (isOpen) => (openDialog.value = isOpen ? ActionTypes.DeleteSync : null)
})

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.Rename:
    case ActionTypes.Delete:
    case ActionTypes.Embed:
    case ActionTypes.ViewUploads:
    case ActionTypes.DeleteSync:
      openDialog.value = item.id
      break
    case ActionTypes.ToggleSyncPause:
      if (!accSyncItem.value) return
      updateAccSyncItem(
        props.project.id,
        accSyncItem.value?.id,
        accSyncItem.value.status === 'paused' ? 'pending' : 'paused'
      )
      break
    case ActionTypes.Share:
      mp.track('Branch Action', { type: 'action', name: 'share' })
      void copyModelLink({ model: props.model })
      break
    case ActionTypes.ViewVersions:
      router.push(modelVersionsRoute(props.project.id, props.model.id))
      break
    case ActionTypes.UploadVersion:
      emit('upload-version')
      break
    case ActionTypes.CopyId:
      copy(props.model.id, { successMessage: 'Copied model ID to clipboard' })
      break
  }
}

const onButtonClick = () => {
  showActionsMenu.value = !showActionsMenu.value
}

const showUploads = () => {
  openDialog.value = ActionTypes.ViewUploads
}

// doing it this way with 2 watchers so that using the 'open' prop is optional
watch(showActionsMenu, (newVal) => emit('update:open', newVal))
watch(
  () => props.open || false,
  (newVal) => (showActionsMenu.value = newVal)
)

defineExpose({
  showUploads
})
</script>

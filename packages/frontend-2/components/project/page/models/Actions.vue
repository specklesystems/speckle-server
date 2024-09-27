<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="relative">
    <LayoutMenu
      v-model:open="showActionsMenu"
      :menu-id="menuId"
      :items="actionsItems"
      :menu-position="menuPosition ? menuPosition : HorizontalDirection.Left"
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
      v-model:open="embedDialogOpen"
      :project="project"
      :model-id="model.id"
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

graphql(`
  fragment ProjectPageModelsActions on Model {
    id
    name
  }
`)

graphql(`
  fragment ProjectPageModelsActions_Project on Project {
    id
    ...ProjectsModelPageEmbed_Project
  }
`)

enum ActionTypes {
  Rename = 'rename',
  Delete = 'delete',
  Share = 'share',
  ViewVersions = 'view-versions',
  UploadVersion = 'upload-version',
  CopyId = 'copy-id',
  Embed = 'embed'
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
  canEdit?: boolean
  menuPosition?: HorizontalDirection
}>()

const copyModelLink = useCopyModelLink()
const { copy } = useClipboard()
const menuId = useId()
const { isLoggedIn } = useActiveUser()
const router = useRouter()

const showActionsMenu = ref(false)
const openDialog = ref(null as Nullable<ActionTypes>)
const embedDialogOpen = ref(false)

const isMain = computed(() => props.model.name === 'main')
const actionsItems = computed<LayoutMenuItem[][]>(() => [
  ...(isLoggedIn.value
    ? [
        [
          {
            title: 'Edit model...',
            id: ActionTypes.Rename,
            disabled: !props.canEdit,
            disabledTooltip: 'Insufficient permissions'
          }
        ]
      ]
    : []),
  [
    {
      title: 'View versions',
      id: ActionTypes.ViewVersions
    },
    {
      title: 'Upload new version...',
      id: ActionTypes.UploadVersion,
      disabled: !props.canEdit,
      disabledTooltip: 'Insufficient permissions'
    }
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
            disabled: isMain.value || !props.canEdit,
            disabledTooltip: 'Insufficient permissions'
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

const mp = useMixpanel()

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.Rename:
    case ActionTypes.Delete:
      openDialog.value = item.id
      break
    case ActionTypes.Share:
      mp.track('Branch Action', { type: 'action', name: 'share' })
      copyModelLink(props.project.id, props.model.id)
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
    case ActionTypes.Embed:
      embedDialogOpen.value = true
      break
  }
}

const onButtonClick = () => {
  showActionsMenu.value = !showActionsMenu.value
}

// doing it this way with 2 watchers so that using the 'open' prop is optional
watch(showActionsMenu, (newVal) => emit('update:open', newVal))
watch(
  () => props.open || false,
  (newVal) => (showActionsMenu.value = newVal)
)
</script>

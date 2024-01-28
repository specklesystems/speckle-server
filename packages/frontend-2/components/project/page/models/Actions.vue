<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div>
    <LayoutMenu
      v-model:open="showActionsMenu"
      :items="actionsItems"
      @click.stop.prevent
      @chosen="onActionChosen"
    >
      <FormButton size="sm" text @click="onButtonClick">
        <EllipsisVerticalIcon class="w-4 h-4" />
      </FormButton>
    </LayoutMenu>
    <ProjectPageModelsCardEditDialog
      v-model:open="isRenameDialogOpen"
      :model="model"
      :project-id="projectId"
      @updated="$emit('model-updated')"
    />
    <ProjectPageModelsCardDeleteDialog
      v-model:open="isDeleteDialogOpen"
      :model="model"
      :project-id="projectId"
      @deleted="$emit('model-updated')"
    />
    <ProjectModelPageDialogEmbed
      v-model:open="embedDialogOpen"
      :project-id="projectId"
      :model-id="model.id"
      :visibility="visibility"
    />
  </div>
</template>
<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import type {
  ProjectPageModelsActionsFragment,
  ProjectVisibility
} from '~~/lib/common/generated/gql/graphql'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { useCopyModelLink } from '~~/lib/projects/composables/modelManagement'
import { EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
import {
  TrashIcon,
  PencilIcon,
  LinkIcon,
  FingerPrintIcon,
  ArrowUpTrayIcon,
  CodeBracketIcon
} from '@heroicons/vue/24/outline'
import { graphql } from '~~/lib/common/generated/gql'
import { useMixpanel } from '~~/lib/core/composables/mp'

graphql(`
  fragment ProjectPageModelsActions on Model {
    id
    name
  }
`)

enum ActionTypes {
  Rename = 'rename',
  Delete = 'delete',
  Share = 'share',
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
  projectId: string
  canEdit?: boolean
  visibility?: ProjectVisibility
}>()

const copyModelLink = useCopyModelLink()
const { copy } = useClipboard()

const showActionsMenu = ref(false)
const openDialog = ref(null as Nullable<ActionTypes>)
const embedDialogOpen = ref(false)

const isMain = computed(() => props.model.name === 'main')
const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Edit',
      id: ActionTypes.Rename,
      disabled: !props.canEdit,
      icon: PencilIcon
    },
    {
      title: 'Upload new version',
      id: ActionTypes.UploadVersion,
      disabled: !props.canEdit,
      icon: ArrowUpTrayIcon
    }
  ],
  [
    { title: 'Copy Link', id: ActionTypes.Share, icon: LinkIcon },
    { title: 'Copy ID', id: ActionTypes.CopyId, icon: FingerPrintIcon },
    { title: 'Embed Model', id: ActionTypes.Embed, icon: CodeBracketIcon }
  ],
  [
    {
      title: 'Delete',
      id: ActionTypes.Delete,
      disabled: isMain.value || !props.canEdit,
      icon: TrashIcon,
      color: 'danger'
    }
  ]
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
      copyModelLink(props.projectId, props.model.id)
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

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
    <ProjectPageModelsCardRenameDialog
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
  </div>
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { ProjectPageModelsActionsFragment } from '~~/lib/common/generated/gql/graphql'
import { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { useCopyModelLink } from '~~/lib/projects/composables/modelManagement'
import { EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
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
  UploadVersion = 'upload-version'
}

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'model-updated'): void
  (e: 'upload-version'): void
}>()

const props = defineProps<{
  open?: boolean
  model: ProjectPageModelsActionsFragment
  projectId: string
  canEdit?: boolean
}>()

const copyModelLink = useCopyModelLink()

const showActionsMenu = ref(false)
const openDialog = ref(null as Nullable<ActionTypes>)

const isMain = computed(() => props.model.name === 'main')
const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    { title: 'Rename', id: ActionTypes.Rename, disabled: !props.canEdit },
    {
      title: 'Delete',
      id: ActionTypes.Delete,
      disabled: isMain.value || !props.canEdit
    }
  ],
  [{ title: 'Share', id: ActionTypes.Share }],
  [
    {
      title: 'Upload new version',
      id: ActionTypes.UploadVersion,
      disabled: !props.canEdit
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

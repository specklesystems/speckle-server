<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div>
    <LayoutMenu
      v-model:open="showActionsMenu"
      :items="actionsItems"
      @click.stop.prevent
      @chosen="onActionChosen"
    >
      <FormButton size="sm" text @click="showActionsMenu = !showActionsMenu">
        <EllipsisVerticalIcon class="w-4 h-4" />
      </FormButton>
    </LayoutMenu>
  </div>
</template>
<script setup lang="ts">
import { EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
import { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { useCopyModelLink } from '~~/lib/projects/composables/modelManagement'

enum ActionTypes {
  Delete = 'delete',
  MoveTo = 'move-to',
  EditMessage = 'edit-message',
  Select = 'select',
  Share = 'share'
}

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'select'): void
}>()

const props = defineProps<{
  open: boolean
  projectId: string
  modelId: string
  versionId: string
}>()

const copyModelLink = useCopyModelLink()

const showActionsMenu = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

// TODO: Permissions? Disabled?
const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    { title: 'Delete', id: ActionTypes.Delete },
    { title: 'Move to', id: ActionTypes.MoveTo },
    { title: 'Edit message', id: ActionTypes.EditMessage }
  ],
  [{ title: 'Select', id: ActionTypes.Select }],
  [{ title: 'Share', id: ActionTypes.Share }]
])

const onActionChosen = (params: { item: LayoutMenuItem }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.Select:
      emit('select')
      break
    case ActionTypes.Share:
      copyModelLink(props.projectId, props.modelId, props.versionId)
      break
  }
}
</script>

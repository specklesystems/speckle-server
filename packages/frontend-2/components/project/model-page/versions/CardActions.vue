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
import {
  TrashIcon,
  PencilIcon,
  LinkIcon,
  FingerPrintIcon,
  ArrowRightOnRectangleIcon,
  CursorArrowRaysIcon
} from '@heroicons/vue/24/outline'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { useCopyModelLink } from '~~/lib/projects/composables/modelManagement'
import { VersionActionTypes } from '~~/lib/projects/helpers/components'

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'select'): void
  (e: 'chosen', v: VersionActionTypes): void
}>()

const props = defineProps<{
  open: boolean
  projectId: string
  modelId: string
  versionId: string
  selectionDisabled?: boolean
}>()

const { copy } = useClipboard()
const copyModelLink = useCopyModelLink()

const disabledMessage = ref(
  'Version editing is only allowed to project or version owners'
)

const showActionsMenu = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const actionsItems = computed<LayoutMenuItem<VersionActionTypes>[][]>(() => [
  [
    {
      title: 'Edit message',
      id: VersionActionTypes.EditMessage,
      disabled: !!props.selectionDisabled,
      disabledTooltip: disabledMessage.value,
      icon: PencilIcon
    }
  ],
  [
    {
      title: 'Select',
      id: VersionActionTypes.Select,
      disabled: !!props.selectionDisabled,
      disabledTooltip: disabledMessage.value,
      icon: CursorArrowRaysIcon
    },
    {
      title: 'Move to',
      id: VersionActionTypes.MoveTo,
      disabled: !!props.selectionDisabled,
      disabledTooltip: disabledMessage.value,
      icon: ArrowRightOnRectangleIcon
    }
  ],
  [
    { title: 'Copy Link', id: VersionActionTypes.Share, icon: LinkIcon },
    { title: 'Copy ID', id: VersionActionTypes.CopyId, icon: FingerPrintIcon }
  ],
  [
    {
      title: 'Delete',
      id: VersionActionTypes.Delete,
      disabled: !!props.selectionDisabled,
      disabledTooltip: disabledMessage.value,
      icon: TrashIcon,
      color: 'danger'
    }
  ]
])

const onActionChosen = (params: { item: LayoutMenuItem<VersionActionTypes> }) => {
  const { item } = params

  switch (item.id) {
    case VersionActionTypes.Select:
      emit('select')
      break
    case VersionActionTypes.Share:
      copyModelLink(props.projectId, props.modelId, props.versionId)
      break
    case VersionActionTypes.CopyId:
      copy(props.versionId, { successMessage: 'Version ID copied to clipboard' })
      break
  }

  emit('chosen', item.id)
}
</script>

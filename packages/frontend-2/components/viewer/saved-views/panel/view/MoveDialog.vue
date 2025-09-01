<template>
  <LayoutDialog
    v-model:open="open"
    title="Move to group"
    max-width="sm"
    :buttons="buttons"
    :on-submit="onSubmit"
  >
    <div class="flex flex-col gap-4">
      <FormSelectSavedViewGroup
        name="group"
        label="Select group"
        show-label
        :project-id="projectId"
        :resource-id-string="resourceIdString"
        :rules="[isRequired]"
      />
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useForm } from 'vee-validate'
import { graphql } from '~/lib/common/generated/gql'
import type {
  FormSelectSavedViewGroup_SavedViewGroupFragment,
  ViewerSavedViewsPanelViewMoveDialog_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import { isRequired } from '~/lib/common/helpers/validation'
import { useUpdateSavedView } from '~/lib/viewer/composables/savedViews/management'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

graphql(`
  fragment ViewerSavedViewsPanelViewMoveDialog_SavedView on SavedView {
    id
    group {
      ...FormSelectSavedViewGroup_SavedViewGroup
    }
    ...UseUpdateSavedView_SavedView
  }
`)

type FormType = {
  group: FormSelectSavedViewGroup_SavedViewGroupFragment
}

const emit = defineEmits<{
  success: [groupId: string]
}>()

const props = defineProps<{
  view: ViewerSavedViewsPanelViewMoveDialog_SavedViewFragment | undefined
}>()

const open = defineModel<boolean>('open', {
  required: true
})
const { handleSubmit, setValues } = useForm<FormType>()
const {
  projectId,
  resources: {
    request: { resourceIdString }
  }
} = useInjectedViewerState()
const updateView = useUpdateSavedView()

const buttons = computed((): LayoutDialogButton[] => [
  {
    id: 'cancel',
    text: 'Cancel',
    props: {
      color: 'outline'
    },
    onClick: () => {
      open.value = false
    }
  },
  {
    id: 'save',
    text: 'Save',
    submit: true
  }
])

const onSubmit = handleSubmit(async (values) => {
  if (!props.view) return
  const selectedGroupId = values.group.isUngroupedViewsGroup ? null : values.group.id
  const currentGroupId = props.view.group.isUngroupedViewsGroup
    ? null
    : props.view.group.id
  const groupId = selectedGroupId !== currentGroupId ? selectedGroupId : null
  if (groupId === undefined) return

  const res = await updateView({
    view: props.view,
    input: {
      id: props.view.id,
      projectId: props.view.projectId,
      groupId
    }
  })

  if (res?.id) {
    emit('success', groupId || 'ungrouped')
    open.value = false
  }
})

watch(open, (newVal, oldVal) => {
  if (!props.view) return

  if (newVal && !oldVal) {
    // Reset form state when dialog opens
    setValues({
      group: props.view.group
    })
  }
})
</script>

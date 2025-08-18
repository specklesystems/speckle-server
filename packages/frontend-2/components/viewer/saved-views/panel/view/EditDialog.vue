<template>
  <LayoutDialog
    v-model:open="open"
    title="Edit view details"
    max-width="sm"
    :buttons="buttons"
    :on-submit="onSubmit"
  >
    <div class="flex flex-col gap-4">
      <FormTextInput
        name="name"
        label="View name"
        show-label
        color="foundation"
        auto-focus
        :rules="[isRequired, isStringOfLength({ maxLength: 255 })]"
      />
      <FormTextArea
        name="description"
        label="Description"
        show-label
        color="foundation"
        placeholder="Add a description..."
        :rules="[isStringOfLength({ maxLength: 1000 })]"
      />
      <FormSelectSavedViewGroup
        name="group"
        show-label
        :project-id="projectId"
        :resource-id-string="resourceIdString"
        :rules="[isRequired]"
      />
      <FormRadioGroup
        :options="radioOptions"
        size="sm"
        name="visibility"
        :rules="[isRequired]"
      />
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { FormRadioGroupItem, LayoutDialogButton } from '@speckle/ui-components'
import { Globe, Lock } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { graphql } from '~/lib/common/generated/gql'
import {
  SavedViewVisibility,
  type FormSelectSavedViewGroup_SavedViewGroupFragment,
  type ViewerSavedViewsPanelViewEditDialog_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import { isRequired, isStringOfLength } from '~/lib/common/helpers/validation'
import { useUpdateSavedView } from '~/lib/viewer/composables/savedViews/management'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

graphql(`
  fragment ViewerSavedViewsPanelViewEditDialog_SavedView on SavedView {
    id
    name
    description
    visibility
    group {
      ...FormSelectSavedViewGroup_SavedViewGroup
    }
    ...UseUpdateSavedView_SavedView
  }
`)

type FormType = {
  name: string
  description: string | null
  visibility: SavedViewVisibility
  group: FormSelectSavedViewGroup_SavedViewGroupFragment
}

const props = defineProps<{
  view: ViewerSavedViewsPanelViewEditDialog_SavedViewFragment | undefined
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

const radioOptions = computed((): FormRadioGroupItem<SavedViewVisibility>[] => [
  {
    value: SavedViewVisibility.Public,
    title: 'Public',
    introduction: 'Visible to anyone with access to the model.',
    icon: Globe
  },
  {
    value: SavedViewVisibility.AuthorOnly,
    title: 'Private',
    introduction: 'Visible only to the view author.',
    icon: Lock
  }
])

const onSubmit = handleSubmit(async (values) => {
  if (!props.view) return

  const name =
    values.name.trim() && values.name.trim() !== props.view.name
      ? values.name.trim()
      : null
  const description =
    values.description?.trim() !== (props.view.description || undefined)
      ? values.description?.trim() || null
      : null
  const visibility =
    values.visibility !== props.view.visibility ? values.visibility : null
  const groupId = values.group.id !== props.view.group.id ? values.group.id : null

  const res = await updateView({
    view: props.view,
    input: {
      name,
      description,
      visibility,
      groupId,
      id: props.view.id,
      projectId: props.view.projectId
    }
  })

  if (res?.id) {
    open.value = false
  }
})

watch(open, (newVal, oldVal) => {
  if (!props.view) return

  if (newVal && !oldVal) {
    // Reset form state when dialog opens
    setValues({
      name: props.view.name,
      description: props.view.description,
      visibility: props.view.visibility,
      group: props.view.group
    })
  }
})
</script>

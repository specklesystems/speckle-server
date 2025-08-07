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
      />
      <FormRadioGroup :options="radioOptions" size="sm" name="visibility" />
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
  type ViewerSavedViewsPanelViewEditDialog_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import { isRequired, isStringOfLength } from '~/lib/common/helpers/validation'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

// TODO: Should we switch to resolvedResourceIdString everywhere?
// TODO: If search for 'Ungrouped' (ungrouped title), then return the ungrouped group too
// TODO: Clicking on visibility triggfers submit??

graphql(`
  fragment ViewerSavedViewsPanelViewEditDialog_SavedView on SavedView {
    id
    name
    description
    visibility
    group {
      ...FormSelectSavedViewGroup_SavedViewGroup
    }
  }
`)

const props = defineProps<{
  view: ViewerSavedViewsPanelViewEditDialog_SavedViewFragment
}>()

const open = defineModel<boolean>('open', {
  required: true
})
const { handleSubmit, setValues } =
  useForm<ViewerSavedViewsPanelViewEditDialog_SavedViewFragment>()
const {
  projectId,
  resources: {
    request: { resourceIdString }
  }
} = useInjectedViewerState()

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

const onSubmit = handleSubmit((values) => {
  devLog(values)
})

watch(open, (newVal, oldVal) => {
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

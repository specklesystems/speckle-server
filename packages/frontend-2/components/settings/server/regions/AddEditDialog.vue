<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    :buttons="dialogButtons"
    hide-closer
    prevent-close-on-click-outside
  >
    <template #header>Create a new region</template>
    <div class="flex flex-col gap-y-4 mb-2">
      <FormTextInput
        name="name"
        label="Region name"
        placeholder="Name"
        color="foundation"
        :rules="[isRequired, isStringOfLength({ maxLength: 64 })]"
        auto-focus
        autocomplete="off"
        show-label
      />
      <FormTextArea
        name="description"
        label="Region description"
        placeholder="Description"
        color="foundation"
        size="lg"
        show-label
        show-optional
        :rules="[isStringOfLength({ maxLength: 65536 })]"
      />
    </div>
  </LayoutDialog>
</template>
<script lang="ts" setup>
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import type { LayoutDialogButton } from '@speckle/ui-components'

const open = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => {
  return [
    {
      text: 'Cancel',
      props: { color: 'outline' },
      onClick: () => (open.value = false)
    },
    {
      text: 'Create',
      props: {
        submit: true
      },
      onClick: noop
    }
  ]
})
</script>

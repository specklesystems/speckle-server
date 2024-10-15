<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Why did you delete this workspace?"
    max-width="xs"
    :buttons="dialogButtons"
  >
    {{ workspaceId }}
    <p class="text-body-xs text-foreground">
      We want to improve so we're curious about your honest feedback. (optional)
    </p>
    <FormTextArea
      v-model="reasonInput"
      name="reasonForDeletion"
      label="Reason for deletion"
      placeholder="Reason for deletion..."
      full-width
      class="text-sm my-2"
      color="foundation"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { FormTextArea, type LayoutDialogButton } from '@speckle/ui-components'
graphql(`
  fragment SettingsWorkspaceGeneralDeleteDialog_Workspace on Workspace {
    id
    name
  }
`)

defineProps<{
  workspaceId: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const reasonInput = ref('')

const onSubmit = () => {
  isOpen.value = false
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
      reasonInput.value = ''
    }
  },
  {
    text: 'Submit',
    props: {
      disabled: !reasonInput.value
    },
    onClick: onSubmit
  }
])

watch(isOpen, () => {
  reasonInput.value = ''
})
</script>

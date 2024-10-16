<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Delete workspace"
    max-width="sm"
    :buttons="dialogButtons"
  >
    // ... existing code ...
    <FormTextArea
      v-model="feedback"
      name="reasonForDeletion"
      label="Why did you delete this workspace?"
      placeholder="We want to improve so we're curious about your honest feedback. (optional)"
      show-label
      show-optional
      full-width
      class="text-sm mb-2"
      color="foundation"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
// ... existing imports ...
import { useZapier } from '~/lib/core/composables/zapier'
import { useForm } from 'vee-validate'

// ... existing code ...

const { sendWebhook } = useZapier()
const { handleSubmit, resetForm } = useForm<{ feedback: string }>()

const feedback = ref('')

const onSubmit = handleSubmit(async () => {
  if (feedback.value) {
    mixpanel.track('Workspace Deleted', {
      workspace_id: props.workspace.id,
      message: feedback.value
    })

    await sendWebhook('https://hooks.zapier.com/hooks/catch/12120532/2m4okri/', {
      userId: activeUser.value?.id ?? '',
      feedback: feedback.value
    })

    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Thank you for your feedback!'
    })
  }

  // Continue with the deletion process
  await onDelete()
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
      workspaceNameInput.value = ''
      feedback.value = ''
    }
  },
  {
    text: 'Delete',
    props: {
      color: 'danger',
      disabled: workspaceNameInput.value !== props.workspace.name
    },
    onClick: onSubmit
  }
])

watch(isOpen, () => {
  workspaceNameInput.value = ''
  resetForm()
})
</script>

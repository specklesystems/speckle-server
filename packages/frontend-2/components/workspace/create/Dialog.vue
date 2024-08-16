<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    hide-closer
    :buttons="dialogButtons"
    title="Create workspace"
  >
    <FormTextInput
      v-model:model-value="workspaceName"
      name="workspace-name"
      label="Name"
      placeholder="My Workspace"
      color="foundation"
      size="lg"
      show-label
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMutation } from '@vue/apollo-composable'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { createWorkspaceMutation } from '~/lib/workspaces/graphql/mutations'

const isOpen = defineModel<boolean>('open', { required: true })

const workspaceName = ref<string>()

const { triggerNotification } = useGlobalToast()
const { mutate: createWorkspace } = useMutation(createWorkspaceMutation)

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => {
      isOpen.value = false
      workspaceName.value = ''
    }
  },
  {
    text: 'Create',
    props: {
      fullWidth: true,
      color: 'primary'
    },
    disabled: !workspaceName.value?.length,
    onClick: onCreate
  }
])

const onCreate = async () => {
  if (!workspaceName.value) {
    return
  }

  const result = await createWorkspace({ input: { name: workspaceName.value } })

  if (result?.data) {
    isOpen.value = false
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Workspace created',
      description: `Created workspace ${workspaceName.value}`
    })
    workspaceName.value = undefined
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to create workspace',
      description: errorMessage
    })
  }
}
</script>

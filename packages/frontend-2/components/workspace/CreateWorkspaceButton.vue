<template>
  <div class="w-full">
    <FormButton
      :disabled="!enableButton"
      full-width
      color="primary"
      @click="isOpen = true"
    >
      New Workspace
    </FormButton>
    <LayoutDialog
      v-model:open="isOpen"
      max-width="sm"
      :buttons="dialogButtons"
      hide-closer
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
  </div>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMutation } from '@vue/apollo-composable'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { createWorkspaceMutation } from '~/lib/workspaces/graphql/mutations'

const { activeUser: user } = useActiveUser()
const { triggerNotification } = useGlobalToast()

const { mutate: createWorkspace } = useMutation(createWorkspaceMutation)

const emit = defineEmits<{
  create: []
}>()

const enableButton = computed(() => user.value?.role === 'server:admin')

const isOpen = ref(false)

const workspaceName = ref<string>()

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
    emit('create')
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to create workspace',
      description: errorMessage
    })
  }
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => {
      isOpen.value = false
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
</script>

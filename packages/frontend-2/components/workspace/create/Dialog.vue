<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    hide-closer
    :buttons="dialogButtons"
    title="Create workspace"
  >
    <div class="flex flex-col gap-4">
      <FormTextInput
        v-model:model-value="workspaceName"
        name="name"
        label="Name"
        placeholder="My Workspace"
        color="foundation"
        show-label
        show-required
      />
      <FormTextInput
        v-model:model-value="workspaceDescription"
        name="description"
        label="Description"
        placeholder="My Workspace"
        color="foundation"
        show-label
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useCreateWorkspace } from '~/lib/workspaces/composables/management'

const isOpen = defineModel<boolean>('open', { required: true })

const createWorkspace = useCreateWorkspace()

const logger = useLogger()

const workspaceName = ref<string>('')
const workspaceDescription = ref<string>('')

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => {
      isOpen.value = false
      resetFields()
    }
  },
  {
    text: 'Create',
    props: {
      fullWidth: true,
      color: 'primary'
    },
    disabled: !workspaceName.value?.length,
    onClick: handleCreateWorkspace
  }
])

const handleCreateWorkspace = async () => {
  if (workspaceName.value?.length) {
    try {
      const newWorkspace = await createWorkspace({
        name: workspaceName.value,
        description: workspaceDescription.value
      })

      if (newWorkspace) {
        isOpen.value = false
        resetFields()
      }
    } catch (error) {
      logger.error('Workspace creation failed:', error)
    }
  }
}

const resetFields = () => {
  workspaceName.value = ''
  workspaceDescription.value = ''
}
</script>

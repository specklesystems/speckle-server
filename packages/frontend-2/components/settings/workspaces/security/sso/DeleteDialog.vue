<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Remove SSO Provider"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground">
      Are you sure you want to remove
      <span class="font-semibold">{{ providerName }}</span>
      from your workspace's SSO configuration?
    </p>
    <p class="text-body-xs text-foreground-2 my-2">
      Users who have used SSO will no longer be able to sign in using their
      organization's credentials.
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useWorkspaceSsoDelete } from '~/lib/workspaces/composables/sso'

const props = defineProps<{
  providerName: string
  workspaceSlug: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })
const { deleteSsoProvider } = useWorkspaceSsoDelete()

const handleRemove = async () => {
  const success = await deleteSsoProvider(props.workspaceSlug)
  if (success) {
    isOpen.value = false
  }
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Remove',
    props: {
      color: 'danger'
    },
    onClick: handleRemove
  }
])
</script>

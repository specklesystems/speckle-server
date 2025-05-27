<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Confirm change"
    max-width="xs"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground mb-2">
      This will allow users with verified domain emails to join automatically without
      admin approval.
    </p>
    <p class="text-body-xs text-foreground">Are you sure you want to enable this?</p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const handleConfirm = () => {
  emit('confirm')
  isOpen.value = false
}

const handleCancel = () => {
  emit('cancel')
  isOpen.value = false
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: handleCancel
  },
  {
    text: 'Confirm',
    props: {
      color: 'primary'
    },
    onClick: handleConfirm
  }
])
</script>

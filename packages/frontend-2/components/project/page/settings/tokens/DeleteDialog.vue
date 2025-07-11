<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Delete token"
    max-width="xs"
    :buttons="dialogButtons"
  >
    Are you sure you want to delete this token?
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'

const emit = defineEmits<{
  (e: 'confirm'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: handleCancel
  },
  {
    text: 'Confirm',
    props: {
      color: 'danger'
    },
    onClick: handleConfirm
  }
])

const handleConfirm = () => {
  emit('confirm')
  isOpen.value = false
}

const handleCancel = () => {
  isOpen.value = false
}
</script>

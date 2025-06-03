<template>
  <LayoutDialog
    v-model:open="isOpen"
    :title="title"
    max-width="xs"
    :buttons="dialogButtons"
  >
    <slot />
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'

defineProps<{
  title: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
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
      color: 'primary'
    },
    onClick: handleConfirm
  }
])

const handleConfirm = () => {
  emit('confirm')
  isOpen.value = false
}

const handleCancel = () => {
  emit('cancel')
  isOpen.value = false
}
</script>

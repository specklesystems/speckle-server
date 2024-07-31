<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Change primary email address"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground">
      Are you sure you want to make
      <span class="font-medium">{{ emailAddress }}</span>
      your primary email?
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

defineProps<{
  emailAddress: string
}>()

const emit = defineEmits<{
  (e: 'set-primary'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })
const { triggerNotification } = useGlobalToast()

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true, outline: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Make primary',
    props: { color: 'primary', fullWidth: true },
    onClick: () => {
      emit('set-primary')
      isOpen.value = false
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Primary email changed'
      })
    }
  }
])
</script>

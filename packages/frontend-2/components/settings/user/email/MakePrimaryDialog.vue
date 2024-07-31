<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Change primary email address"
    max-width="xs"
    :buttons="dialogButtons"
  >
    <p>
      Are you sure you want to make
      <span class="font-semibold">{{ emailAddress }}</span>
      your primary email?
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

defineProps<{
  emailAddress: string
}>()

const emit = defineEmits<{
  (e: 'make-primary'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })
const { triggerNotification } = useGlobalToast()

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Make primary',
    props: { color: 'default', fullWidth: true },
    onClick: () => {
      emit('make-primary')
      isOpen.value = false
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Primary email changed'
      })
    }
  }
])
</script>

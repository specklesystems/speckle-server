<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Delete email address"
    max-width="xs"
    :buttons="dialogButtons"
  >
    <p>
      Are you sure you want to remove
      <span class="font-semibold">{{ emailAddress }}</span>
      from your account?
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

const props = defineProps<{
  emailAddress: string
}>()

const emit = defineEmits<{
  (e: 'deleted'): void
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
    text: 'Delete',
    props: { color: 'default', fullWidth: true },
    onClick: () => {
      emit('deleted')
      isOpen.value = false
      triggerNotification({
        type: ToastNotificationType.Success,
        title: `Email ${props.emailAddress} removed`
      })
    }
  }
])
</script>

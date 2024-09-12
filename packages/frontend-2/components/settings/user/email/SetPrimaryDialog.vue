<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Change primary email address"
    max-width="xs"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground mb-2">
      Are you sure you want to make
      <span class="font-medium">{{ email }}</span>
      your primary email?
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { settingsSetPrimaryUserEmailMutation } from '~/lib/settings/graphql/mutations'
import { useMutation } from '@vue/apollo-composable'
import {
  getFirstErrorMessage,
  convertThrowIntoFetchResult
} from '~~/lib/common/helpers/graphql'

const props = defineProps<{
  emailId: string
  email: string
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const { triggerNotification } = useGlobalToast()
const { mutate: updateMutation } = useMutation(settingsSetPrimaryUserEmailMutation)

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', outline: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Make primary',
    props: { color: 'primary' },
    onClick: () => {
      onSetPrimary()
      isOpen.value = false
    }
  }
])

const onSetPrimary = async () => {
  const result = await updateMutation({ input: { id: props.emailId } }).catch(
    convertThrowIntoFetchResult
  )
  if (result?.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: `Made ${props.email} primary`
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: errorMessage
    })
  }
}
</script>

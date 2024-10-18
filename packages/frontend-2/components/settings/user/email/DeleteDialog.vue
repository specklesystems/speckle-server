<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Delete email address"
    max-width="xs"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground mb-2">
      Are you sure you want to delete
      <span class="font-medium">{{ email }}</span>
      from your account?
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { settingsDeleteUserEmailMutation } from '~/lib/settings/graphql/mutations'
import { useMutation } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  getFirstErrorMessage,
  convertThrowIntoFetchResult
} from '~~/lib/common/helpers/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'

const props = defineProps<{
  emailId: string
  email: string
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const { mutate: deleteMutation } = useMutation(settingsDeleteUserEmailMutation)
const { triggerNotification } = useGlobalToast()
const mixpanel = useMixpanel()

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Delete',
    props: { color: 'primary' },
    onClick: () => {
      onDeleteEmail()
    }
  }
])

const onDeleteEmail = async () => {
  const result = await deleteMutation({ input: { id: props.emailId } }).catch(
    convertThrowIntoFetchResult
  )
  if (result?.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: `${props.email} deleted`
    })

    mixpanel.track('Email Deleted')
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: errorMessage
    })
  }

  isOpen.value = false
}
</script>

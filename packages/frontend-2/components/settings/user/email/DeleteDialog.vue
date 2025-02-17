<template>
  <LayoutDialog
    v-model:open="isOpen"
    :title="cancel ? 'Cancel adding email' : 'Delete email address'"
    max-width="xs"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground mb-2">
      {{
        cancel
          ? `Are you sure you want to cancel adding ${email?.email} to your account?`
          : `Are you sure you want to delete ${email?.email} from your account?`
      }}
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { UserEmail } from '~/lib/common/generated/gql/graphql'
import { useUserEmails } from '~/lib/user/composables/emails'

const props = defineProps<{
  email?: UserEmail
  cancel?: boolean
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { deleteUserEmail } = useUserEmails()

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: props.cancel ? 'Confirm' : 'Delete',
    props: { color: 'primary' },
    onClick: () => {
      onDeleteEmail()
    }
  }
])

const onDeleteEmail = async () => {
  if (!props.email) return
  const success = await deleteUserEmail(props.email)
  if (success) {
    isOpen.value = false
  }
}
</script>

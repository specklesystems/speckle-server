<template>
  <LayoutDialog
    v-model:open="isOpen"
    :title="isAdding ? 'Stop adding email?' : 'Delete email address'"
    max-width="xs"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground mb-2">
      {{
        isAdding
          ? `Do you want to stop adding ${email?.email}? Any progress will be discarded.`
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
  isAdding?: boolean
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { deleteUserEmail } = useUserEmails()

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: props.isAdding ? 'No' : 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: props.isAdding ? 'Yes' : 'Delete',
    props: { color: 'primary' },
    onClick: () => {
      onDeleteEmail()
    }
  }
])

const onDeleteEmail = async () => {
  if (!props.email) return
  const success = await deleteUserEmail({
    email: props.email,
    hideToast: props.isAdding
  })
  if (success) {
    isOpen.value = false
  }
}
</script>

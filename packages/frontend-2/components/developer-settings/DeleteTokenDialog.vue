<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    title="Delete Access Token"
    :buttons="dialogButtons"
    max-height
  >
    <div class="flex flex-col gap-6 text-sm text-foreground">
      <p>
        Are you sure you want to
        <strong>permanently delete</strong>
        the selected access token?
      </p>
      <div v-if="token" class="flex flex-col gap-2">
        <strong>{{ token.name }}</strong>
      </div>

      <p>
        This
        <strong>cannot</strong>
        be undone.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { LayoutDialog } from '@speckle/ui-components'
import { TokenItem } from '~~/lib/developer-settings/helpers/types'
import { deleteAccessTokenMutation } from '~~/lib/developer-settings/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

const props = defineProps<{
  token: TokenItem | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: deleteMutation } = useMutation(deleteAccessTokenMutation)

const isOpen = defineModel<boolean>('open', { required: true })

const deleteConfirmed = async () => {
  const tokenId = props.token?.id

  if (!tokenId) {
    return
  }

  const result = await deleteMutation(
    {
      token: tokenId
    },
    {
      update: (cache, { data }) => {
        if (data?.apiTokenRevoke) {
          const cacheId = getCacheId('ApiToken', tokenId)
          cache.evict({ id: cacheId })
        }
      }
    }
  ).catch(convertThrowIntoFetchResult)

  if (result?.data?.apiTokenRevoke) {
    isOpen.value = false
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Access Token deleted',
      description: 'The access token has been successfully deleted'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete access token',
      description: errorMessage
    })
  }
}

const dialogButtons = [
  {
    text: 'Delete',
    props: { color: 'danger', fullWidth: true },
    onClick: deleteConfirmed
  },
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => (isOpen.value = false)
  }
]
</script>

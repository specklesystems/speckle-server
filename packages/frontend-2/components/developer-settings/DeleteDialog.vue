<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :title="`Delete ${itemType}`"
    :buttons="dialogButtons"
    max-height
  >
    <div class="flex flex-col gap-6 text-sm text-foreground">
      <p>
        Are you sure you want to
        <strong>permanently delete</strong>
        the selected {{ itemType.toLowerCase() }}?
      </p>
      <div v-if="item" class="flex flex-col gap-2">
        <strong class="truncate">{{ item.name }}</strong>
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
import { ApplicationItem, TokenItem } from '~~/lib/developer-settings/helpers/types'
import {
  deleteAccessTokenMutation,
  deleteApplicationMutation
} from '~~/lib/developer-settings/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

const props = defineProps<{
  item: TokenItem | ApplicationItem | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: deleteTokenMutation } = useMutation(deleteAccessTokenMutation)
const { mutate: deleteAppMutation } = useMutation(deleteApplicationMutation)

const isOpen = defineModel<boolean>('open', { required: true })

const itemType = computed(() => {
  return props.item && 'secret' in props.item ? 'Application' : 'Access Token'
})

const isApplication = (i: TokenItem | ApplicationItem | null): i is ApplicationItem =>
  !!(i && 'secret' in i)

const deleteConfirmed = async () => {
  const itemId = props.item?.id

  if (!itemId) {
    return
  }

  if (!isApplication(props.item)) {
    const result = await deleteTokenMutation(
      {
        token: itemId
      },
      {
        update: (cache, { data }) => {
          if (data?.apiTokenRevoke) {
            const cacheId = getCacheId('ApiToken', itemId)
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
  } else {
    const result = await deleteAppMutation(
      {
        appId: itemId
      },
      {
        update: (cache, { data }) => {
          if (data?.appDelete) {
            const cacheId = getCacheId('ServerApp', itemId)
            cache.evict({ id: cacheId })
          }
        }
      }
    ).catch(convertThrowIntoFetchResult)

    if (result?.data?.appDelete) {
      isOpen.value = false
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Application deleted',
        description: 'The application has been successfully deleted'
      })
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to delete application',
        description: errorMessage
      })
    }
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

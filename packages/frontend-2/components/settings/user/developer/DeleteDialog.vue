<template>
  <LayoutDialog v-model:open="isOpen" max-width="xs" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <div class="flex flex-col gap-2 text-body-xs text-foreground mb-2">
      <p>
        Are you sure you want to
        <strong>permanently {{ lowerFirst(itemActionVerb) }}</strong>
        the selected {{ itemType.toLowerCase() }}?
        <template v-if="isAuthorization(item)">
          (Removing access to an app will log you out of it on all devices.)
        </template>
      </p>
      <div v-if="item" class="flex flex-col gap-2">
        <strong class="truncate">{{ item.name }}</strong>
      </div>

      <p>
        This action
        <strong>cannot</strong>
        be undone.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation, useMutationLoading } from '@vue/apollo-composable'
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'
import type {
  ApplicationItem,
  TokenItem,
  AuthorizedAppItem
} from '~~/lib/developer-settings/helpers/types'
import {
  deleteAccessTokenMutation,
  deleteApplicationMutation,
  revokeAppAccessMutation
} from '~~/lib/developer-settings/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { lowerFirst } from 'lodash-es'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import type { User } from '~/lib/common/generated/gql/graphql'

type ItemType = TokenItem | ApplicationItem | AuthorizedAppItem | null

const isToken = (i: ItemType): i is TokenItem => !!(i && 'lastChars' in i)
const isApplication = (i: ItemType): i is ApplicationItem => !!(i && 'secret' in i)
const isAuthorization = (i: ItemType): i is AuthorizedAppItem =>
  !(isToken(i) || isApplication(i))

const props = defineProps<{
  item: ItemType
}>()

const { triggerNotification } = useGlobalToast()
const isLoading = useMutationLoading()
const { mutate: deleteToken } = useMutation(deleteAccessTokenMutation)
const { mutate: deleteApp } = useMutation(deleteApplicationMutation)
const { mutate: revokeAuthorization } = useMutation(revokeAppAccessMutation)
const { userId } = useActiveUser()

const isOpen = defineModel<boolean>('open', { required: true })

const itemType = computed(() => {
  if (isToken(props.item)) {
    return `access token`
  } else if (isApplication(props.item)) {
    return `application`
  } else {
    return 'authorization'
  }
})

const itemActionVerb = computed(() => {
  return isToken(props.item) || isApplication(props.item) ? 'Delete' : 'Remove'
})

const title = computed(() => {
  return `${itemActionVerb.value} ${itemType.value}`
})

const deleteConfirmed = async () => {
  const uid = userId.value
  const itemId = props.item?.id
  if (!itemId || !uid) {
    return
  }

  if (isToken(props.item)) {
    const result = await deleteToken(
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
  } else if (isApplication(props.item)) {
    const result = await deleteApp(
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
  } else {
    const result = await revokeAuthorization(
      { appId: itemId },
      {
        update: (cache, res) => {
          if (res.data?.appRevokeAccess) {
            modifyObjectFields<undefined, User['authorizedApps']>(
              cache,
              getCacheId('User', uid),
              (_fieldName, _variables, value) => {
                if (!value) return value
                return value.filter(
                  (a) => a.__ref !== getCacheId('ServerAppListItem', itemId)
                )
              },
              { fieldNameWhitelist: ['authorizedApps'] }
            )
          }
        }
      }
    ).catch(convertThrowIntoFetchResult)

    if (result?.data?.appRevokeAccess) {
      isOpen.value = false
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Authorization removed',
        description: 'The application authorization has been successfully removed'
      })
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to revoke app authorization',
        description: errorMessage
      })
    }
  }
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: (): boolean => (isOpen.value = false)
  },
  {
    text: itemActionVerb.value,
    props: { color: 'danger' },
    disabled: isLoading.value,
    onClick: deleteConfirmed
  }
])
</script>

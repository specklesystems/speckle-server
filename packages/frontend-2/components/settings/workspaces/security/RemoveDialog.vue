<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Remove domain"
    max-width="sm"
    :buttons="dialogButtons"
  >
    Are you sure you want to remove
    <b>@{{ domain.domain }}</b>
    from your workspace's verified domains?
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useApolloClient } from '@vue/apollo-composable'
import {
  type Workspace,
  type WorkspaceSettingsSecurity_WorkspaceDomainFragment
} from '~/lib/common/generated/gql/graphql'
import { getCacheId, getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { settingsDeleteWorkspaceDomainMutation } from '~/lib/settings/graphql/mutations'

const props = defineProps<{
  workspaceId: string
  domain: WorkspaceSettingsSecurity_WorkspaceDomainFragment
}>()

const apollo = useApolloClient().client

const { triggerNotification } = useGlobalToast()

const isOpen = defineModel<boolean>('open', { required: true })

const handleRemove = async () => {
  const result = await apollo
    .mutate({
      mutation: settingsDeleteWorkspaceDomainMutation,
      variables: {
        input: {
          workspaceId: props.workspaceId,
          id: props.domain.id
        }
      },
      update: (cache, res) => {
        const { data } = res
        if (!data?.workspaceMutations) return

        cache.modify<Workspace>({
          id: getCacheId('Workspace', props.workspaceId),
          fields: {
            domains(currentDomains, { isReference }) {
              return [...currentDomains].filter((domain) =>
                isReference(domain) ? false : domain.id !== props.domain.id
              )
            }
          }
        })
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (result?.data) {
    isOpen.value = false
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Domain removed',
      description: `Removed domain successfully`
    })
  } else {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to remove domain',
      description: getFirstErrorMessage(result?.errors)
    })
  }
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Remove',
    props: {
      fullWidth: true,
      color: 'danger'
    },
    onClick: handleRemove
  }
])
</script>

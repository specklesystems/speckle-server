<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Remove domain"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground">
      Are you sure you want to remove
      <span class="font-semibold">@{{ domain.domain }}</span>
      from your workspace's verified domains?
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useApolloClient } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment } from '~/lib/common/generated/gql/graphql'
import {
  getCacheId,
  getFirstErrorMessage,
  modifyObjectField
} from '~/lib/common/helpers/graphql'
import { settingsDeleteWorkspaceDomainMutation } from '~/lib/settings/graphql/mutations'
import { useMixpanel } from '~/lib/core/composables/mp'
import type { MaybeNullOrUndefined } from '@speckle/shared'

graphql(`
  fragment SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomain on WorkspaceDomain {
    id
    domain
  }
`)

graphql(`
  fragment SettingsWorkspacesSecurityDomainRemoveDialog_Workspace on Workspace {
    id
    domains {
      ...SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomain
    }
  }
`)

const props = defineProps<{
  workspaceId: MaybeNullOrUndefined<string>
  domain: SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const apollo = useApolloClient().client
const { triggerNotification } = useGlobalToast()
const mixpanel = useMixpanel()

const handleRemove = async () => {
  if (!props.workspaceId) return

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
        if (!data?.workspaceMutations || !props.workspaceId) return

        modifyObjectField(
          cache,
          getCacheId('Workspace', props.workspaceId),
          'domains',
          ({ value, helpers }) => {
            return value?.filter(
              (domain) => helpers.readField(domain, 'id') !== props.domain.id
            )
          }
        )
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

    mixpanel.track('Workspace Domain Removed', {
      // eslint-disable-next-line camelcase
      workspace_id: props.workspaceId
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
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Remove',
    props: {
      color: 'danger'
    },
    onClick: handleRemove
  }
])
</script>

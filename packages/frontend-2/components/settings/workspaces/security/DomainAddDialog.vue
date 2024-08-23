<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Add domain"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <div class="h-24">
      <FormSelectWorkspaceDomains
        :domains="verifiedUserDomains"
        :model-value="selectedDomain"
        @update:model-value="onSelectedDomainUpdate"
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useApolloClient } from '@vue/apollo-composable'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { settingsAddWorkspaceDomainMutation } from '~/lib/settings/graphql/mutations'
import { getCacheId, getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import type {
  SettingsWorkspacesSecurityDomainAddDialog_UserFragment,
  SettingsWorkspacesSecurityDomainAddDialog_WorkspaceFragment,
  Workspace
} from '~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { isString } from 'lodash-es'

graphql(`
  fragment SettingsWorkspacesSecurityDomainAddDialog_Workspace on Workspace {
    id
    domains {
      id
      domain
    }
    discoverabilityEnabled
  }
  fragment SettingsWorkspacesSecurityDomainAddDialog_User on User {
    id
    emails {
      id
      email
      verified
    }
  }
`)

const props = defineProps<{
  workspace: SettingsWorkspacesSecurityDomainAddDialog_WorkspaceFragment
  verifiedUser: SettingsWorkspacesSecurityDomainAddDialog_UserFragment
}>()

const { workspace } = toRefs(props)

const isOpen = defineModel<boolean>('open', { required: true })

const { triggerNotification } = useGlobalToast()

const apollo = useApolloClient().client

const selectedDomain = ref<string>('')
const onSelectedDomainUpdate = (e?: string | string[]) => {
  if (!isString(e)) {
    return
  }
  selectedDomain.value = e
}

const verifiedUserDomains = computed(() => [
  ...new Set(
    (props.verifiedUser.emails ?? [])
      .filter((email) => email.verified)
      .map((email) => email.email.split('@')[1])
  )
])

const onAdd = async () => {
  const result = await apollo
    .mutate({
      mutation: settingsAddWorkspaceDomainMutation,
      variables: {
        input: {
          domain: selectedDomain.value,
          workspaceId: workspace.value.id
        }
      },
      optimisticResponse: {
        workspaceMutations: {
          addDomain: {
            __typename: 'Workspace',
            id: workspace.value.id,
            domains: [
              ...workspace.value.domains,
              {
                __typename: 'WorkspaceDomain',
                id: '',
                domain: selectedDomain.value
              }
            ],
            discoverabilityEnabled:
              workspace.value.domains.length === 0
                ? true
                : workspace.value.discoverabilityEnabled
          }
        }
      },
      update: (cache, res) => {
        const { data } = res
        if (!data?.workspaceMutations) return

        cache.modify<Workspace>({
          id: getCacheId('Workspace', props.workspace.id),
          fields: {
            discoverabilityEnabled() {
              return data?.workspaceMutations.addDomain.discoverabilityEnabled || false
            },
            domains() {
              return [...(data?.workspaceMutations.addDomain.domains || [])]
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
      title: 'Domain added',
      description: `The verified domain ${selectedDomain.value} has been added to your workspace`
    })
  } else {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to add verified domain',
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
    text: 'Add',
    props: {
      fullWidth: true,
      color: 'primary'
    },
    onClick: onAdd
  }
])
</script>

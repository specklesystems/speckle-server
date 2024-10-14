import {
  settingsUpdateWorkspaceMutation,
  settingsAddWorkspaceDomainMutation
} from '~/lib/settings/graphql/mutations'
import { useMutation, useApolloClient } from '@vue/apollo-composable'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  getCacheId
} from '~~/lib/common/helpers/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type {
  WorkspaceUpdateInput,
  AddDomainToWorkspaceInput
} from '~~/lib/common/generated/gql/graphql'
import type { WorkspaceDomain, Workspace } from '~/lib/common/generated/gql/graphql'
import { gql } from '@apollo/client'

export function useUpdateWorkspace() {
  const { mutate, loading } = useMutation(settingsUpdateWorkspaceMutation)
  const { triggerNotification } = useGlobalToast()

  return {
    mutate: async (input: WorkspaceUpdateInput) => {
      const result = await mutate({ input }).catch(convertThrowIntoFetchResult)

      if (result?.data) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Workspace updated'
        })
      } else {
        const errorMessage = getFirstErrorMessage(result?.errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Workspace update failed',
          description: errorMessage
        })
      }

      return result
    },
    loading
  }
}

export function useAddWorkspaceDomain() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()

  return {
    mutate: async (
      input: AddDomainToWorkspaceInput,
      domains: WorkspaceDomain[],
      discoverabilityEnabled: boolean,
      domainBasedMembershipProtectionEnabled: boolean
    ) => {
      const result = await apollo
        .mutate({
          mutation: settingsAddWorkspaceDomainMutation,
          variables: {
            input: {
              domain: input.domain,
              workspaceId: input.workspaceId
            }
          },
          optimisticResponse: {
            workspaceMutations: {
              addDomain: {
                __typename: 'Workspace',
                id: input.workspaceId,
                slug: (
                  apollo.readFragment({
                    id: getCacheId('Workspace', input.workspaceId),
                    fragment: gql`
                      fragment AddDomainWorkspace on Workspace {
                        slug
                      }
                    `
                  }) as Workspace
                ).slug,
                domains: [
                  ...domains,
                  {
                    __typename: 'WorkspaceDomain',
                    id: '',
                    domain: input.domain
                  }
                ],
                discoverabilityEnabled:
                  domains.length === 0 ? true : discoverabilityEnabled,
                domainBasedMembershipProtectionEnabled
              }
            }
          },
          update: (cache, res) => {
            const { data } = res
            if (!data?.workspaceMutations) return

            cache.modify<Workspace>({
              id: getCacheId('Workspace', input.workspaceId),
              fields: {
                discoverabilityEnabled() {
                  return (
                    data?.workspaceMutations.addDomain.discoverabilityEnabled || false
                  )
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
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Domain added',
          description: `The verified domain ${input.domain} has been added to your workspace`
        })
      } else {
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Failed to add verified domain',
          description: getFirstErrorMessage(result?.errors)
        })
      }
    }
  }
}

import { useApolloClient } from '@vue/apollo-composable'
import { useAccAuthManager } from '~/lib/acc/composables/useAccAuthManager'
import { AccIntegration } from '~/lib/acc/types'
import { WorkspaceFeatureName } from '~/lib/common/generated/gql/graphql'
import type { Integration } from '~/lib/integrations/types'
import { workspaceFeatureEnabledCheckQuery } from '~/lib/workspaces/graphql/queries'

export function useAccIntegration() {
  const integration = ref<Integration>(AccIntegration)
  const apollo = useApolloClient().client
  const loading = ref(false)

  const checkConnection = async (workspaceSlug: string, workspaceId: string) => {
    loading.value = true
    try {
      const isAccModuleEnabled = useIsAccModuleEnabled()

      if (isAccModuleEnabled) {
        const accIntegationEnabled = await isAccEnabledInWorkspace(workspaceId)
        const callbackEndpoint = `settings/workspaces/${workspaceSlug}/integrations`

        if (accIntegationEnabled) {
          const { isExpired, tokens, tryGetTokensFromCookies } = useAccAuthManager()
          await tryGetTokensFromCookies() // also refreshes the tokens - so we can rely on existance of tokens to say 'connected'

          integration.value = {
            ...AccIntegration,
            connected: tokens.value !== undefined,
            status: isExpired.value
              ? 'expired'
              : tokens.value !== undefined
              ? 'connected'
              : 'notConnected',
            enabled: true,
            callbackEndpoint
          }
        } else {
          integration.value = { ...AccIntegration, callbackEndpoint }
        }
      }
    } finally {
      loading.value = false
    }
  }

  const isAccEnabledInWorkspace = async (workspaceId: string) => {
    const { data } = await apollo.query({
      query: workspaceFeatureEnabledCheckQuery,
      variables: {
        workspaceId,
        featureName: WorkspaceFeatureName.AccIntegration
      },
      fetchPolicy: 'network-only'
    })
    return data?.workspace?.hasAccessToFeature ?? false
  }

  const checkCredientials = async () => {
    const { tryGetTokensFromCookies } = useAccAuthManager()
    await tryGetTokensFromCookies()
  }

  return {
    loading,
    integration,
    checkConnection,
    checkCredientials
  }
}

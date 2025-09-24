import { useBentleyAuthManager } from '~/lib/bentley/composables/useBentleyAuthManager'
import { BentleyIntegration } from '~/lib/bentley/types'
import type { Integration } from '~/lib/integrations/types'

export function useBentleyIntegration() {
  const integration = ref<Integration>(BentleyIntegration)
  const loading = ref(false)

  const checkConnection = async (workspaceSlug: string, workspaceId: string) => {
    loading.value = true

    const { isExpired, tokens, tryGetTokensFromCookies } = useBentleyAuthManager()
    await tryGetTokensFromCookies()
    const callbackEndpoint = `settings/workspaces/${workspaceSlug}/integrations`
    integration.value = {
      ...BentleyIntegration,
      connected: tokens.value !== undefined,
      status: isExpired.value
        ? 'expired'
        : tokens.value !== undefined
        ? 'connected'
        : 'notConnected',
      enabled: true,
      callbackEndpoint
    }
    loading.value = false
  }

  return {
    integration,
    checkConnection
  }
}

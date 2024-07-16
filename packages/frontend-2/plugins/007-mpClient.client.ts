import { LogicError } from '@speckle/ui-components'
import { fakeMixpanelClient, type MixpanelClient } from '~/lib/common/helpers/mp'
import { useClientsideMixpanelClientBuilder } from '~/lib/core/clients/mp'

/**
 * mixpanel-browser only supports being ran on the client-side (hence the name)! So it's only going to be accessible
 * in client-side execution branches
 */

export default defineNuxtPlugin(async () => {
  const logger = useLogger()
  const build = useClientsideMixpanelClientBuilder()

  let mixpanel: MixpanelClient | undefined = undefined

  try {
    // Dynamic import to allow suppressing loading errors that happen because of adblock
    mixpanel = (await build()) || undefined
  } catch (e) {
    logger.warn(e, 'Failed to load mixpanel in CSR')
  }

  if (!mixpanel) {
    // Implement mocked version
    mixpanel = fakeMixpanelClient()
  }

  return {
    provide: {
      mixpanel: () => {
        if (!mixpanel) throw new LogicError('Mixpanel unexpectedly not defined')
        return mixpanel
      }
    }
  }
})

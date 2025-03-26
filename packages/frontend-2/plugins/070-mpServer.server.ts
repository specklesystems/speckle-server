import { LogicError } from '@speckle/ui-components'
import { fakeMixpanelClient, type MixpanelClient } from '~/lib/common/helpers/mp'
import { useServersideMixpanelClientBuilder } from '~/lib/core/clients/mpServer'

/**
 * mixpanel only supports being ran on the server-side! So it's only going to be accessible
 * in SSR execution branches
 */

type LimitedMixpanel = MixpanelClient

const fakeLimitedMixpanel = fakeMixpanelClient

export default defineNuxtPlugin(async () => {
  const logger = useLogger()

  let mixpanel: LimitedMixpanel | undefined = undefined

  try {
    const build = useServersideMixpanelClientBuilder()
    mixpanel = (await build()) || undefined
  } catch (e) {
    logger.warn(e, 'Failed to load mixpanel in SSR')
  }

  if (!mixpanel) {
    // Implement mocked version
    mixpanel = fakeLimitedMixpanel()
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

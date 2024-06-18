/* eslint-disable camelcase */
import { LogicError } from '@speckle/ui-components'
import type { OverridedMixpanel } from 'mixpanel-browser'
import type { Merge } from 'type-fest'

/**
 * mixpanel-browser only supports being ran on the client-side (hence the name)! So it's only going to be accessible
 * in client-side execution branches
 */

type LimitedMixpanel = Merge<
  Pick<
    OverridedMixpanel,
    'track' | 'init' | 'reset' | 'register' | 'identify' | 'people' | 'add_group'
  >,
  {
    people: Pick<OverridedMixpanel['people'], 'set' | 'set_once'>
  }
>

const fakeLimitedMixpanel = (): LimitedMixpanel => ({
  init: noop as LimitedMixpanel['init'],
  track: noop,
  reset: noop,
  register: noop,
  identify: noop,
  people: {
    set: noop,
    set_once: noop
  },
  add_group: noop
})

export default defineNuxtPlugin(async () => {
  const {
    public: { mixpanelApiHost, mixpanelTokenId, logCsrEmitProps }
  } = useRuntimeConfig()
  const logger = useLogger()

  let mixpanel: LimitedMixpanel | undefined = undefined

  try {
    mixpanel = import.meta.client
      ? (await import('mixpanel-browser')).default
      : undefined
    if (import.meta.server) {
      mixpanel = {
        ...fakeLimitedMixpanel(),
        track: () => {
          throw new Error('mixpanel is not available on the server-side')
        },
        identify: () => {
          throw new Error('mixpanel is not available on the server-side')
        },
        register: () => {
          throw new Error('mixpanel is not available on the server-side')
        }
      }
    }
  } catch (e) {
    logger.warn(e, 'Failed to load mixpanel')
  }

  if (!mixpanel) {
    // Implement mocked version
    mixpanel = fakeLimitedMixpanel()
  }

  // Init
  mixpanel.init(mixpanelTokenId, {
    api_host: mixpanelApiHost,
    debug: !!import.meta.dev && logCsrEmitProps
  })

  return {
    provide: {
      mixpanel: () => {
        if (!mixpanel) throw new LogicError('Mixpanel unexpectedly not defined')
        return mixpanel
      }
    }
  }
})

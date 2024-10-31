/* eslint-disable camelcase */
import type { OverridedMixpanel } from 'mixpanel-browser'
import type { Merge } from 'type-fest'

export type MixpanelClient = Merge<
  Pick<
    OverridedMixpanel,
    | 'track'
    | 'init'
    | 'reset'
    | 'register'
    | 'identify'
    | 'people'
    | 'add_group'
    | 'get_group'
    | 'alias'
  >,
  {
    people: Pick<OverridedMixpanel['people'], 'set' | 'set_once'>
  }
>

export const HOST_APP = 'web-2'
export const HOST_APP_DISPLAY_NAME = 'Web 2.0 App'

export const fakeMixpanelClient = (): MixpanelClient => ({
  init: noop as MixpanelClient['init'],
  track: noop,
  reset: noop,
  register: noop,
  identify: noop,
  people: {
    set: noop,
    set_once: noop
  },
  add_group: noop,
  get_group: noop as MixpanelClient['get_group'],
  alias: noop
})

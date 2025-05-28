/* eslint-disable camelcase */
import { Mixpanel } from 'mixpanel'

export type MixpanelFakeEventRecord = Array<{ event: string; payload: unknown }>

type MixpanelFakeStorage = {
  events?: MixpanelFakeEventRecord
  people?: Record<string, object | string>
  groups?: Record<string, object | string>
}

export const buildMixpanelFake = ({
  events,
  people,
  groups
}: MixpanelFakeStorage = {}): Mixpanel => {
  const notImplemented = () => {
    throw new Error('Faked mixpanel function has no implementation')
  }

  return {
    init: notImplemented,
    track: (event, payload) => {
      if (events) {
        events.push({ event, payload })
      }
    },
    track_batch: notImplemented,
    import: notImplemented,
    import_batch: notImplemented,
    alias: notImplemented,
    people: {
      set: (key, val) => {
        if (people) {
          people[key] = val
        }
      },
      unset: notImplemented,
      set_once: notImplemented,
      increment: notImplemented,
      append: notImplemented,
      union: notImplemented,
      remove: notImplemented,
      track_charge: notImplemented,
      clear_charges: notImplemented,
      delete_user: notImplemented
    },
    groups: {
      set: (_, key, val) => {
        if (groups) {
          groups[key] = val
        }
      },
      unset: notImplemented,
      set_once: notImplemented,
      union: notImplemented,
      remove: notImplemented,
      delete_group: notImplemented
    }
  }
}

import type { ServerInviteRecord } from '@/modules/serverinvites/domain/types'

export const serverinvitesEventNamespace = 'serverinvites' as const

const prefix = `${serverinvitesEventNamespace}.` as const

export const ServerInvitesEvents = {
  Created: `${prefix}created`,
  Finalized: `${prefix}finalized`,
  Canceled: `${prefix}canceled`
} as const

export type ServerInvitesEventsPayloads = {
  [ServerInvitesEvents.Created]: {
    invite: ServerInviteRecord
  }
  [ServerInvitesEvents.Finalized]: {
    invite: ServerInviteRecord
    finalizerUserId: string
    accept: boolean
    /**
     * finalizerUserId will always be the invite target. This field will be the actual person triggering the action,
     * which in auto-accept flows will be the initial inviter. Use this for reporting.
     */
    trueFinalizerUserId: string
  }
  [ServerInvitesEvents.Canceled]: {
    invite: ServerInviteRecord
    cancelerUserId: string
  }
}

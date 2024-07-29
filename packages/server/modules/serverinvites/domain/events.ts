import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'

export const serverinvitesEventNamespace = 'serverinvites' as const

const prefix = `${serverinvitesEventNamespace}.` as const

export const ServerInvitesEvents = {
  Created: `${prefix}created`,
  Finalized: `${prefix}finalized`
} as const

export type ServerInvitesEventsKeys =
  (typeof ServerInvitesEvents)[keyof typeof ServerInvitesEvents]

export type ServerInvitesEventsPayloads = {
  [ServerInvitesEvents.Created]: {
    invite: ServerInviteRecord
  }
  [ServerInvitesEvents.Finalized]: {
    invite: ServerInviteRecord
    finalizerUserId: string
    accept: boolean
  }
}

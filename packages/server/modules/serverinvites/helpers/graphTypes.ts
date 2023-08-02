import { LimitedUserRecord } from '@/modules/core/helpers/types'

export type PendingStreamCollaboratorGraphQLReturn = {
  id: string
  inviteId: string
  streamId: string
  title: string
  role: string
  invitedById: string
  user: LimitedUserRecord | null
}

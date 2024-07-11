import { ResourceTargets } from '@/modules/serverinvites/helpers/inviteHelper'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { SetNonNullable } from 'type-fest'

export type ServerInviteRecord = {
  id: string
  target: string
  inviterId: string
  createdAt: Date
  used: boolean
  message: Nullable<string>
  resourceTarget: typeof ResourceTargets.Streams | null
  resourceId: Nullable<string>
  role: Nullable<string>
  token: string
  serverRole: Nullable<string>
}

export type StreamInviteRecord = SetNonNullable<
  ServerInviteRecord,
  'resourceId' | 'resourceTarget'
>

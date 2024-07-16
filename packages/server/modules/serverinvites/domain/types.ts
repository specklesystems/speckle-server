import { ResourceTargets } from '@/modules/serverinvites/helpers/legacyCore'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { SetNonNullable } from 'type-fest'

export type InviteResourceTargetType = 'project' | 'server'

export type InviteResourceTarget<
  T extends InviteResourceTargetType = InviteResourceTargetType,
  R extends string = string
> = {
  resourceId: string
  resourceType: T
  role: R
}

export type ServerInviteRecord = {
  id: string
  target: string
  inviterId: string
  createdAt: Date
  message: Nullable<string>
  resources: Array<InviteResourceTarget>
  /**
   * @deprecated Use resources instead.
   */
  resourceTarget: typeof ResourceTargets.Streams | null
  /**
   * @deprecated Use resources instead
   */
  resourceId: Nullable<string>
  /**
   * @deprecated Use resources instead.
   */
  role: Nullable<string>
  token: string
  /**
   * @deprecated Use resources instead
   */
  serverRole: Nullable<string>
}

export type StreamInviteRecord = SetNonNullable<
  ServerInviteRecord,
  'resourceId' | 'resourceTarget'
>

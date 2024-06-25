import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import { CreateInviteParams } from '@/modules/serverinvites/domain/operations'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'

export type InviteResult = {
  inviteId: string
  token: string
}
export type CreateAndSendInvite = (
  params: CreateInviteParams,
  inviterResourceAccessLimits?: TokenResourceIdentifier[] | null
) => Promise<InviteResult>

export type FinalizeStreamInvite = (
  accept: boolean,
  streamId: string,
  token: string,
  userId: string
) => Promise<void>

export type ResendInviteEmail = (invite: ServerInviteRecord) => Promise<void>

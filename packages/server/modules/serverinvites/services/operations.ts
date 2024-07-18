import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import { ServerInfo } from '@/modules/core/helpers/types'
import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import { EmailTemplateParams } from '@/modules/emails/services/emailRendering'
import { CreateInviteParams } from '@/modules/serverinvites/domain/operations'
import {
  InviteResourceTarget,
  ServerInviteRecord
} from '@/modules/serverinvites/domain/types'
import { ResolvedTargetData } from '@/modules/serverinvites/helpers/core'
import { MaybeAsync, MaybeNullOrUndefined } from '@speckle/shared'

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

export type CollectAndValidateResourceTargets = (params: {
  input: CreateInviteParams
  inviter: UserWithOptionalRole
  inviterResourceAccessLimits?: TokenResourceIdentifier[] | null
  target: ResolvedTargetData
  targetUser: MaybeNullOrUndefined<UserWithOptionalRole>
  serverInfo: ServerInfo
}) => MaybeAsync<InviteResourceTarget[]>

export type BuildInviteEmailContents = (params: {
  invite: ServerInviteRecord
  serverInfo: ServerInfo
  inviter: UserWithOptionalRole
}) => MaybeAsync<{
  emailParams: EmailTemplateParams
  subject: string
}>

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

/**
 * This function should throw if there's validation issue
 */
export type ValidateResourceInviteBeforeFinalization = (params: {
  invite: ServerInviteRecord
  finalizerUserId: string
  accept: boolean
}) => MaybeAsync<void>

/**
 * Actually handle the invite being accepted or declined
 */
export type ProcessFinalizedResourceInvite = ValidateResourceInviteBeforeFinalization

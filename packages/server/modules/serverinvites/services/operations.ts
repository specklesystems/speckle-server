import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import { ServerInfo } from '@/modules/core/helpers/types'
import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import { EmailTemplateParams } from '@/modules/emails/services/emailRendering'
import { CreateInviteParams } from '@/modules/serverinvites/domain/operations'
import {
  InviteResourceTarget,
  InviteResourceTargetType,
  PrimaryInviteResourceTarget,
  ServerInviteRecord
} from '@/modules/serverinvites/domain/types'
import { ResolvedTargetData } from '@/modules/serverinvites/helpers/core'
import { ServerInviteResourceFilter } from '@/modules/serverinvites/repositories/serverInvites'
import { MaybeAsync, MaybeNullOrUndefined } from '@speckle/shared'

export type InviteResult = {
  inviteId: string
  token: string
}
export type CreateAndSendInvite = (
  params: CreateInviteParams,
  inviterResourceAccessLimits: MaybeNullOrUndefined<TokenResourceIdentifier[]>
) => Promise<InviteResult>

export type FinalizeInvite = (params: {
  finalizerUserId: string
  finalizerResourceAccessLimits: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  accept: boolean
  token: string
  resourceType?: InviteResourceTargetType
  /**
   * If true, finalization also allows accepting an invite that technically belongs to a different
   * email, one that is not yet attached to any user account.
   * If the invite is accepted, the email will be attached to the user account as well in a verified state.
   */
  allowAttachingNewEmail?: boolean
}) => Promise<void>

export type ResendInviteEmail = (params: {
  inviteId: string
  resourceFilter?: ServerInviteResourceFilter
}) => Promise<void>

export type CollectAndValidateResourceTargets = (params: {
  input: CreateInviteParams
  inviter: UserWithOptionalRole
  inviterResourceAccessLimits: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  target: ResolvedTargetData
  targetUser: MaybeNullOrUndefined<UserWithOptionalRole>
  serverInfo: ServerInfo
  /**
   * Primarily these functions are used to validate on invite creation, but they also get ran on invite finalization.
   * In those circumstances this flag will be set.
   */
  finalizingInvite?: boolean
}) => MaybeAsync<Array<InviteResourceTarget | PrimaryInviteResourceTarget>>

export type BuildInviteEmailContents = (params: {
  invite: ServerInviteRecord
  serverInfo: ServerInfo
  inviter: UserWithOptionalRole
}) => MaybeAsync<{
  emailParams: EmailTemplateParams
  subject: string
}>

export enum InviteFinalizationAction {
  ACCEPT = 'accept',
  DECLINE = 'decline',
  /**
   * Cancel differs from decline in the way that only the resource owner can cancel the invite,
   * invite target can only decline
   */
  CANCEL = 'cancel'
}

/**
 * This function should throw if there's validation issue
 */
export type ValidateResourceInviteBeforeFinalization = (params: {
  invite: ServerInviteRecord
  finalizerUserId: string
  finalizerResourceAccessLimits: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  action: InviteFinalizationAction
}) => MaybeAsync<void>

/**
 * Actually handle the invite being accepted or declined. The actual invite record
 * is already deleted by this point and doesn't require handling.
 */
export type ProcessFinalizedResourceInvite = (params: {
  invite: ServerInviteRecord
  finalizerUserId: string
  action: InviteFinalizationAction.ACCEPT | InviteFinalizationAction.DECLINE
}) => MaybeAsync<void>

export type GetInvitationTargetUsers = (params: {
  invites: ServerInviteRecord[]
}) => Promise<{ [key: string]: UserWithOptionalRole }>

export type ValidateServerInvite = (
  email?: string,
  token?: string
) => Promise<ServerInviteRecord>

export type FinalizeInvitedServerRegistration = (
  email: string,
  userId: string
) => Promise<void>

export type ResolveAuthRedirectPath = (invite?: ServerInviteRecord) => string

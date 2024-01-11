import { MaybeNullOrUndefined, Roles } from '@speckle/shared'
import {
  MutationStreamInviteUseArgs,
  ProjectInviteCreateInput,
  ProjectInviteUseInput,
  StreamInviteCreateInput,
  TokenResourceIdentifier,
  TokenResourceIdentifierType
} from '@/modules/core/graph/generated/graphql'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  buildUserTarget,
  ResourceTargets
} from '@/modules/serverinvites/helpers/inviteHelper'
import { createAndSendInvite } from '@/modules/serverinvites/services/inviteCreationService'
import { has } from 'lodash'
import { finalizeStreamInvite } from '@/modules/serverinvites/services/inviteProcessingService'
import {
  ContextResourceAccessRules,
  isResourceAllowed
} from '@/modules/core/helpers/token'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'

type FullProjectInviteCreateInput = ProjectInviteCreateInput & { projectId: string }

const isStreamInviteCreateInput = (
  i: StreamInviteCreateInput | FullProjectInviteCreateInput
): i is StreamInviteCreateInput => has(i, 'streamId')

export async function createStreamInviteAndNotify(
  input: StreamInviteCreateInput | FullProjectInviteCreateInput,
  inviterId: string,
  inviterResourceAccessRules: MaybeNullOrUndefined<TokenResourceIdentifier[]>
) {
  const { email, userId, role } = input

  if (!email && !userId) {
    throw new InviteCreateValidationError('Either email or userId must be specified')
  }

  const target = (userId ? buildUserTarget(userId) : email)!
  await createAndSendInvite(
    {
      target,
      inviterId,
      resourceTarget: ResourceTargets.Streams,
      resourceId: isStreamInviteCreateInput(input) ? input.streamId : input.projectId,
      role: role || Roles.Stream.Contributor,
      message: isStreamInviteCreateInput(input)
        ? input.message || undefined
        : undefined,
      serverRole: input.serverRole || undefined
    },
    inviterResourceAccessRules
  )
}

const isStreamInviteUseArgs = (
  i: MutationStreamInviteUseArgs | ProjectInviteUseInput
): i is MutationStreamInviteUseArgs => has(i, 'streamId')

export async function useStreamInviteAndNotify(
  input: MutationStreamInviteUseArgs | ProjectInviteUseInput,
  userId: string,
  userResourceAccessRules: ContextResourceAccessRules
) {
  const { accept, token } = input

  if (
    !isResourceAllowed({
      resourceId: isStreamInviteUseArgs(input) ? input.streamId : input.projectId,
      resourceType: TokenResourceIdentifierType.Project,
      resourceAccessRules: userResourceAccessRules
    })
  ) {
    throw new StreamInvalidAccessError(
      'You are not allowed to process an invite for this stream',
      {
        info: {
          userId,
          userResourceAccessRules,
          input
        }
      }
    )
  }

  await finalizeStreamInvite(
    accept,
    isStreamInviteUseArgs(input) ? input.streamId : input.projectId,
    token,
    userId
  )
}

import { MaybeNullOrUndefined, Roles, ServerRoles, StreamRoles } from '@speckle/shared'
import {
  MutationStreamInviteUseArgs,
  ProjectInviteCreateInput,
  ProjectInviteUseInput,
  StreamInviteCreateInput
} from '@/modules/core/graph/generated/graphql'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  buildUserTarget,
  ResourceTargets
} from '@/modules/serverinvites/helpers/inviteHelper'
import { has } from 'lodash'
import {
  ContextResourceAccessRules,
  isResourceAllowed
} from '@/modules/core/helpers/token'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import {
  CreateAndSendInvite,
  FinalizeStreamInvite
} from '@/modules/serverinvites/services/operations'
import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'

type FullProjectInviteCreateInput = ProjectInviteCreateInput & { projectId: string }

const isStreamInviteCreateInput = (
  i: StreamInviteCreateInput | FullProjectInviteCreateInput
): i is StreamInviteCreateInput => has(i, 'streamId')

export const createStreamInviteAndNotifyFactory =
  ({ createAndSendInvite }: { createAndSendInvite: CreateAndSendInvite }) =>
  async (
    input: StreamInviteCreateInput | FullProjectInviteCreateInput,
    inviterId: string,
    inviterResourceAccessRules: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  ) => {
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
        role: (role as StreamRoles) || Roles.Stream.Contributor,
        message: isStreamInviteCreateInput(input)
          ? input.message || undefined
          : undefined,
        serverRole: (input.serverRole as ServerRoles) || undefined
      },
      inviterResourceAccessRules
    )
  }

const isStreamInviteUseArgs = (
  i: MutationStreamInviteUseArgs | ProjectInviteUseInput
): i is MutationStreamInviteUseArgs => has(i, 'streamId')

export const useStreamInviteAndNotifyFactory =
  ({ finalizeStreamInvite }: { finalizeStreamInvite: FinalizeStreamInvite }) =>
  async (
    input: MutationStreamInviteUseArgs | ProjectInviteUseInput,
    userId: string,
    userResourceAccessRules: ContextResourceAccessRules
  ) => {
    const { accept, token } = input

    if (
      !isResourceAllowed({
        resourceId: isStreamInviteUseArgs(input) ? input.streamId : input.projectId,
        resourceType: 'project',
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

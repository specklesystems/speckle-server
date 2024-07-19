import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import {
  MutationStreamInviteUseArgs,
  ProjectInviteCreateInput,
  ProjectInviteUseInput,
  StreamInviteCreateInput,
  TokenResourceIdentifier
} from '@/modules/core/graph/generated/graphql'
import {
  ContextResourceAccessRules,
  isResourceAllowed
} from '@/modules/core/helpers/token'
import { ProjectInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import { buildUserTarget } from '@/modules/serverinvites/helpers/core'
import {
  CreateAndSendInvite,
  FinalizeInvite
} from '@/modules/serverinvites/services/operations'
import { MaybeNullOrUndefined, Roles } from '@speckle/shared'
import { has } from 'lodash'

type FullProjectInviteCreateInput = ProjectInviteCreateInput & { projectId: string }

const isStreamInviteCreateInput = (
  i: StreamInviteCreateInput | FullProjectInviteCreateInput
): i is StreamInviteCreateInput => has(i, 'streamId')

export const createProjectInviteFactory =
  (deps: { createAndSendInvite: CreateAndSendInvite }) =>
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
    await deps.createAndSendInvite(
      {
        target,
        inviterId,
        message: isStreamInviteCreateInput(input)
          ? input.message || undefined
          : undefined,
        primaryResourceTarget: {
          resourceType: ProjectInviteResourceType,
          resourceId: isStreamInviteCreateInput(input)
            ? input.streamId
            : input.projectId,
          role: role || Roles.Stream.Contributor,
          primary: true
        }
      },
      inviterResourceAccessRules
    )
  }

const isStreamInviteUseArgs = (
  i: MutationStreamInviteUseArgs | ProjectInviteUseInput
): i is MutationStreamInviteUseArgs => has(i, 'streamId')

export const useProjectInviteAndNotifyFactory =
  (deps: { finalizeInvite: FinalizeInvite }) =>
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
        'You are not allowed to process an invite for this project',
        {
          info: {
            userId,
            userResourceAccessRules,
            input
          }
        }
      )
    }

    await deps.finalizeInvite({
      accept,
      resourceType: ProjectInviteResourceType,
      token,
      finalizerUserId: userId
    })
  }

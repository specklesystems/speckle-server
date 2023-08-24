import { Roles } from '@speckle/shared'
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
import { createAndSendInvite } from '@/modules/serverinvites/services/inviteCreationService'
import { has } from 'lodash'
import { finalizeStreamInvite } from '@/modules/serverinvites/services/inviteProcessingService'

type FullProjectInviteCreateInput = ProjectInviteCreateInput & { projectId: string }

const isStreamInviteCreateInput = (
  i: StreamInviteCreateInput | FullProjectInviteCreateInput
): i is StreamInviteCreateInput => has(i, 'streamId')

export async function createStreamInviteAndNotify(
  input: StreamInviteCreateInput | FullProjectInviteCreateInput,
  inviterId: string
) {
  const { email, userId, role } = input

  if (!email && !userId) {
    throw new InviteCreateValidationError('Either email or userId must be specified')
  }

  const target = userId ? buildUserTarget(userId) : (email as string)
  await createAndSendInvite({
    target,
    inviterId,
    resourceTarget: ResourceTargets.Streams,
    resourceId: isStreamInviteCreateInput(input) ? input.streamId : input.projectId,
    role: role || Roles.Stream.Contributor,
    message: isStreamInviteCreateInput(input) ? input.message || undefined : undefined,
    serverRole: input.serverRole || undefined
  })
}

const isStreamInviteUseArgs = (
  i: MutationStreamInviteUseArgs | ProjectInviteUseInput
): i is MutationStreamInviteUseArgs => has(i, 'streamId')

export async function useStreamInviteAndNotify(
  input: MutationStreamInviteUseArgs | ProjectInviteUseInput,
  userId: string
) {
  const { accept, token } = input
  await finalizeStreamInvite(
    accept,
    isStreamInviteUseArgs(input) ? input.streamId : input.projectId,
    token,
    userId
  )
}

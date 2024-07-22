import { addStreamInviteDeclinedActivity } from '@/modules/activitystream/services/streamActivity'
import { getStream } from '@/modules/core/repositories/streams'
import { addOrUpdateStreamCollaborator } from '@/modules/core/services/streams/streamAccessService'
import { ProjectInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { InviteFinalizingError } from '@/modules/serverinvites/errors'
import {
  InviteFinalizationAction,
  ProcessFinalizedResourceInvite,
  ValidateResourceInviteBeforeFinalization
} from '@/modules/serverinvites/services/operations'
import { Roles } from '@speckle/shared'

type ValidateProjectInviteBeforeFinalizationFactoryDeps = {
  getProject: typeof getStream
}

export const validateProjectInviteBeforeFinalizationFactory =
  (
    deps: ValidateProjectInviteBeforeFinalizationFactoryDeps
  ): ValidateResourceInviteBeforeFinalization =>
  async (params) => {
    const { getProject } = deps
    const { invite, finalizerUserId, action } = params

    if (invite.resource.resourceType !== ProjectInviteResourceType) {
      throw new InviteFinalizingError(
        'Attempting to finalize non-project invite as project invite',
        { info: { invite, finalizerUserId } }
      )
    }

    const project = await getProject({
      streamId: invite.resource.resourceId,
      userId: finalizerUserId
    })
    if (!project) {
      throw new InviteFinalizingError(
        'Attempting to finalize invite to a non-existant project'
      )
    }

    if (action === InviteFinalizationAction.CANCEL) {
      if (project.role !== Roles.Stream.Owner) {
        throw new InviteFinalizingError(
          'Attempting to cancel invite to a project that the user does not own'
        )
      }
    } else {
      if (project.role) {
        throw new InviteFinalizingError(
          'Attempting to finalize invite to a project that the user already has access to'
        )
      }
    }
  }

type ProcessFinalizedProjectInviteFactoryDeps = {
  getProject: typeof getStream
  addInviteDeclinedActivity: typeof addStreamInviteDeclinedActivity
  addProjectRole: typeof addOrUpdateStreamCollaborator
}

export const processFinalizedProjectInviteFactory =
  (deps: ProcessFinalizedProjectInviteFactoryDeps): ProcessFinalizedResourceInvite =>
  async (params) => {
    const { getProject, addInviteDeclinedActivity, addProjectRole } = deps
    const { invite, finalizerUserId, action } = params

    const project = await getProject({ streamId: invite.resource.resourceId })
    if (!project) {
      throw new InviteFinalizingError(
        'Attempting to finalize invite to a non-existant project'
      )
    }

    if (action === InviteFinalizationAction.ACCEPT) {
      await addProjectRole(
        project.id,
        finalizerUserId,
        invite.resource.role || Roles.Stream.Contributor,
        invite.inviterId,
        null,
        { fromInvite: true }
      )
    } else if (action === InviteFinalizationAction.DECLINE) {
      await addInviteDeclinedActivity({
        streamId: invite.resource.resourceId,
        inviteTargetId: finalizerUserId,
        inviterId: invite.inviterId,
        stream: project
      })
    }
  }

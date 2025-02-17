import { AddStreamInviteDeclinedActivity } from '@/modules/activitystream/domain/operations'
import {
  AddOrUpdateStreamCollaborator,
  GetStream
} from '@/modules/core/domain/streams/operations'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import { isResourceAllowed } from '@/modules/core/helpers/token'
import { ProjectInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { InviteFinalizingError } from '@/modules/serverinvites/errors'
import {
  InviteFinalizationAction,
  ProcessFinalizedResourceInvite,
  ValidateResourceInviteBeforeFinalization
} from '@/modules/serverinvites/services/operations'
import { Roles } from '@speckle/shared'

type ValidateProjectInviteBeforeFinalizationFactoryDeps = {
  getProject: GetStream
}

export const validateProjectInviteBeforeFinalizationFactory =
  (
    deps: ValidateProjectInviteBeforeFinalizationFactoryDeps
  ): ValidateResourceInviteBeforeFinalization =>
  async (params) => {
    const { getProject } = deps
    const { invite, finalizerUserId, action, finalizerResourceAccessLimits } = params

    if (invite.resource.resourceType !== ProjectInviteResourceType) {
      throw new InviteFinalizingError(
        'Attempting to finalize non-project invite as project invite',
        { info: { invite, finalizerUserId } }
      )
    }

    // If decline, skip all further validation
    if (action === InviteFinalizationAction.DECLINE) {
      return
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

    if (
      !isResourceAllowed({
        resourceId: project.id,
        resourceType: 'project',
        resourceAccessRules: finalizerResourceAccessLimits
      })
    ) {
      throw new InviteFinalizingError(
        'You are not allowed to process an invite for this project'
      )
    }
  }

type ProcessFinalizedProjectInviteFactoryDeps = {
  getProject: GetStream
  addInviteDeclinedActivity: AddStreamInviteDeclinedActivity
  addProjectRole: AddOrUpdateStreamCollaborator
}

export const processFinalizedProjectInviteFactory =
  (deps: ProcessFinalizedProjectInviteFactoryDeps): ProcessFinalizedResourceInvite =>
  async (params) => {
    const { getProject, addInviteDeclinedActivity, addProjectRole } = deps
    const { invite, finalizerUserId, action } = params

    const project = await getProject({ streamId: invite.resource.resourceId })

    if (action === InviteFinalizationAction.DECLINE) {
      // Skip validation so user can get rid of the invite regardless
      if (project) {
        await addInviteDeclinedActivity({
          streamId: invite.resource.resourceId,
          inviteTargetId: finalizerUserId,
          inviterId: invite.inviterId,
          stream: project
        })
      }
      return
    }

    if (!project) {
      throw new InviteFinalizingError(
        'Attempting to finalize invite to a non-existant project'
      )
    }

    if (action === InviteFinalizationAction.ACCEPT) {
      try {
        await addProjectRole(
          project.id,
          finalizerUserId,
          invite.resource.role || Roles.Stream.Contributor,
          invite.inviterId,
          null,
          { fromInvite: true }
        )
      } catch (e) {
        if (!(e instanceof StreamInvalidAccessError)) {
          throw e
        }

        throw new InviteFinalizingError(
          'Original inviter no longer has the rights to invite you to this project'
        )
      }
    }
  }

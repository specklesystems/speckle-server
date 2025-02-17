import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import { CollectAndValidateResourceTargets } from '@/modules/serverinvites/services/operations'
import { ServerInviteResourceTarget } from '@/modules/serverinvites/domain/types'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  isProjectResourceTarget,
  isServerResourceTarget
} from '@/modules/serverinvites/helpers/core'
import { authorizeResolver } from '@/modules/shared'
import { Roles } from '@speckle/shared'
import { flatten } from 'lodash'
import { GetStream } from '@/modules/core/domain/streams/operations'

const collectAndValidateServerTargetFactory =
  (): CollectAndValidateResourceTargets => (params) => {
    const { input, inviter, targetUser, serverInfo } = params

    const primaryResourceTarget = input.primaryResourceTarget
    const primaryServerResourceTarget = isServerResourceTarget(primaryResourceTarget)
      ? primaryResourceTarget
      : null

    // If not primarily a server invite and user already exists, skip adding the server target
    if (!primaryServerResourceTarget && targetUser) {
      return []
    }

    // Validate primary resource target
    if (primaryServerResourceTarget) {
      if (targetUser) {
        throw new InviteCreateValidationError(
          'This email is already associated with an account on this server'
        )
      }
    }

    const targetRole =
      primaryServerResourceTarget?.role ||
      primaryResourceTarget.secondaryResourceRoles?.[ServerInviteResourceType] ||
      Roles.Server.User

    // Role based validation
    if (!Object.values(Roles.Server).includes(targetRole)) {
      throw new InviteCreateValidationError('Invalid server role')
    }
    if (inviter.role !== Roles.Server.Admin && targetRole === Roles.Server.Admin) {
      throw new InviteCreateValidationError(
        'Only server admins can assign the admin server role'
      )
    }
    if (targetRole === Roles.Server.Guest && !serverInfo.guestModeEnabled) {
      throw new InviteCreateValidationError('Guest mode is not enabled on this server')
    }

    // Build server resource target
    const finalTarget: ServerInviteResourceTarget & { primary: boolean } = {
      resourceId: '',
      resourceType: ServerInviteResourceType,
      role: targetRole,
      primary: !!primaryServerResourceTarget
    }

    return [finalTarget]
  }

type CollectAndValidateProjectTargetFactoryDeps = {
  getStream: GetStream
}

const collectAndValidateProjectTargetFactory =
  ({
    getStream
  }: CollectAndValidateProjectTargetFactoryDeps): CollectAndValidateResourceTargets =>
  async (params) => {
    const { input, inviter, targetUser, inviterResourceAccessLimits } = params

    const primaryResourceTarget = input.primaryResourceTarget
    const primaryProjectResourceTarget = isProjectResourceTarget(primaryResourceTarget)
      ? primaryResourceTarget
      : null

    const targetRole =
      primaryProjectResourceTarget?.role ||
      primaryResourceTarget.secondaryResourceRoles?.[ProjectInviteResourceType] ||
      Roles.Stream.Contributor

    if (!Object.values(Roles.Stream).includes(targetRole)) {
      throw new InviteCreateValidationError('Unexpected project invite role')
    }
    if (targetUser?.role === Roles.Server.Guest && targetRole === Roles.Stream.Owner) {
      throw new InviteCreateValidationError('Guest users cannot be owners of projects')
    }

    if (!primaryProjectResourceTarget) {
      // Not primarily a project target, skip adding resource target
      return []
    }

    const { resourceId } = primaryProjectResourceTarget

    // Validate that inviter has access to this project
    try {
      await authorizeResolver(
        inviter.id,
        resourceId,
        Roles.Stream.Owner,
        inviterResourceAccessLimits
      )
    } catch (e) {
      throw new InviteCreateValidationError(
        "Inviter doesn't have owner access to the project",
        { cause: e as Error }
      )
    }

    const project = await getStream({
      streamId: resourceId,
      userId: targetUser?.id
    })
    if (!project) {
      throw new InviteCreateValidationError(
        'Attempting to invite into a non-existant project'
      )
    }
    if (project.role) {
      throw new InviteCreateValidationError(
        'The target user is already a collaborator of the specified project'
      )
    }

    return [{ ...primaryProjectResourceTarget, primary: true }]
  }

export type CollectAndValidateCoreTargetsFactoryDeps =
  CollectAndValidateProjectTargetFactoryDeps

export const collectAndValidateCoreTargetsFactory =
  (deps: CollectAndValidateCoreTargetsFactoryDeps): CollectAndValidateResourceTargets =>
  async (params) => {
    const collectors = [
      collectAndValidateProjectTargetFactory,
      collectAndValidateServerTargetFactory
    ].map((factory) => factory(deps))

    return flatten(await Promise.all(collectors.map((collector) => collector(params))))
  }

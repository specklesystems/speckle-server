import { getStream } from '@/modules/core/repositories/streams'
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
import { Roles, ServerRoles } from '@speckle/shared'
import { flatten } from 'lodash'

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

    const secondaryRole =
      primaryResourceTarget.secondaryResourceRoles?.[ServerInviteResourceType]

    // Validate primary resource target
    if (primaryServerResourceTarget) {
      const { role } = primaryServerResourceTarget
      const { guestModeEnabled } = serverInfo

      if (targetUser) {
        throw new InviteCreateValidationError(
          'This email is already associated with an account on this server'
        )
      }

      if (!Object.values(Roles.Server).includes(role)) {
        throw new InviteCreateValidationError('Invalid server role')
      }

      if (inviter.role !== Roles.Server.Admin && role === Roles.Server.Admin) {
        throw new InviteCreateValidationError(
          'Only server admins can assign the admin server role'
        )
      }

      if (role === Roles.Server.Guest && !guestModeEnabled) {
        throw new InviteCreateValidationError(
          'Guest mode is not enabled on this server'
        )
      }
    } else {
      // Validate secondary role, if any
      if (
        secondaryRole &&
        !Object.values(Roles.Server).includes(secondaryRole as ServerRoles)
      ) {
        throw new InviteCreateValidationError('Invalid server role')
      }
    }

    // Build server resource target
    const finalTarget: ServerInviteResourceTarget & { primary: boolean } = {
      resourceId: '',
      resourceType: ServerInviteResourceType,
      role: primaryServerResourceTarget?.role || secondaryRole || Roles.Server.User,
      primary: !!primaryServerResourceTarget
    }

    return [finalTarget]
  }

type CollectAndValidateProjectTargetFactoryDeps = {
  getStream: typeof getStream
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

    if (!primaryProjectResourceTarget) {
      // Validate secondary resource role, in case its relevant down the line
      const secondaryRole =
        primaryResourceTarget.secondaryResourceRoles?.[ProjectInviteResourceType]
      if (secondaryRole && !Object.values(Roles.Stream).includes(secondaryRole)) {
        throw new InviteCreateValidationError('Unexpected project invite role')
      }
      // Not primarily a project target, skip adding resource target
      return []
    }

    const { role, resourceId } = primaryProjectResourceTarget

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
        "Inviter doesn't have proper access to the resource",
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
    if (!Object.values(Roles.Stream).includes(role)) {
      throw new InviteCreateValidationError('Unexpected project invite role')
    }
    if (targetUser?.role === Roles.Server.Guest && role === Roles.Stream.Owner) {
      throw new InviteCreateValidationError('Guest users cannot be owners of projects')
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

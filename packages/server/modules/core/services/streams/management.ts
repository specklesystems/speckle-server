import { MaybeNullOrUndefined, Roles, wait } from '@speckle/shared'
import {
  ProjectUpdateInput,
  ProjectUpdateRoleInput,
  StreamRevokePermissionInput,
  StreamUpdateInput
} from '@/modules/core/graph/generated/graphql'
import { StreamRecord } from '@/modules/core/helpers/types'
import {
  StreamInvalidAccessError,
  StreamUpdateError
} from '@/modules/core/errors/stream'
import { isProjectCreateInput } from '@/modules/core/helpers/stream'
import { has } from 'lodash'
import {
  ContextResourceAccessRules,
  isNewResourceAllowed
} from '@/modules/core/helpers/token'
import {
  TokenResourceIdentifier,
  TokenResourceIdentifierType
} from '@/modules/core/domain/tokens/types'
import {
  ProjectEvents,
  ProjectsEventsEmitter
} from '@/modules/core/events/projectsEmitter'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { ProjectInviteResourceType } from '@/modules/serverinvites/domain/constants'
import {
  AddOrUpdateStreamCollaborator,
  CreateStream,
  DeleteStream,
  DeleteStreamRecord,
  GetStream,
  IsStreamCollaborator,
  LegacyCreateStream,
  LegacyUpdateStream,
  PermissionUpdateInput,
  RemoveStreamCollaborator,
  StoreStream,
  UpdateStream,
  UpdateStreamRecord,
  UpdateStreamRole
} from '@/modules/core/domain/streams/operations'
import { StoreBranch } from '@/modules/core/domain/branches/operations'
import { AuthorizeResolver } from '@/modules/shared/domain/operations'
import { DeleteAllResourceInvites } from '@/modules/serverinvites/domain/operations'
import {
  AddStreamDeletedActivity,
  AddStreamUpdatedActivity
} from '@/modules/activitystream/domain/operations'

export const createStreamReturnRecordFactory =
  (deps: {
    createStream: StoreStream
    createBranch: StoreBranch
    inviteUsersToProject: ReturnType<typeof inviteUsersToProjectFactory>
    projectsEventsEmitter: ProjectsEventsEmitter
  }): CreateStream =>
  async (params): Promise<StreamRecord> => {
    const { ownerId, ownerResourceAccessRules } = params

    const canCreateStream = isNewResourceAllowed({
      resourceType: TokenResourceIdentifierType.Project,
      resourceAccessRules: ownerResourceAccessRules
    })
    if (!canCreateStream) {
      throw new StreamInvalidAccessError(
        'You do not have the permissions to create a new stream'
      )
    }

    const stream = await deps.createStream(params, { ownerId })
    const streamId = stream.id

    // Create a default main branch
    await deps.createBranch({
      name: 'main',
      description: 'default branch',
      streamId,
      authorId: ownerId
    })

    // Invite contributors?
    if (!isProjectCreateInput(params) && params.withContributors?.length) {
      // TODO: should be injected in the resolver
      await deps.inviteUsersToProject(
        ownerId,
        streamId,
        params.withContributors,
        ownerResourceAccessRules
      )
    }

    await deps.projectsEventsEmitter(ProjectEvents.Created, {
      project: stream,
      ownerId
    })

    return stream
  }

/**
 * @deprecated Use createStreamReturnRecordFactory()
 */
export const legacyCreateStreamFactory =
  (deps: { createStreamReturnRecord: CreateStream }): LegacyCreateStream =>
  async (params) => {
    const { id } = await deps.createStreamReturnRecord(params)
    return id
  }

/**
 * Delete stream & notify users (emit events & save activity)
 */
export const deleteStreamAndNotifyFactory =
  (deps: {
    deleteStream: DeleteStreamRecord
    authorizeResolver: AuthorizeResolver
    addStreamDeletedActivity: AddStreamDeletedActivity
    deleteAllResourceInvites: DeleteAllResourceInvites
  }): DeleteStream =>
  async (
    streamId: string,
    deleterId: string,
    deleterResourceAccessRules: ContextResourceAccessRules,
    options?: {
      skipAccessChecks?: boolean
    }
  ) => {
    const { skipAccessChecks = false } = options || {}

    if (!skipAccessChecks) {
      await deps.authorizeResolver(
        deleterId,
        streamId,
        Roles.Stream.Owner,
        deleterResourceAccessRules
      )
    }

    await deps.addStreamDeletedActivity({ streamId, deleterId })

    // TODO: this has been around since before my time, we should get rid of it...
    // delay deletion by a bit so we can do auth checks
    await wait(250)

    // Delete after event so we can do authz
    const deleteAllStreamInvites = deps.deleteAllResourceInvites
    await Promise.all([
      deleteAllStreamInvites({
        resourceId: streamId,
        resourceType: ProjectInviteResourceType
      }),
      deps.deleteStream(streamId)
    ])
    return true
  }

/**
 * Update stream metadata & notify users (emit events & save activity)
 */
export const updateStreamAndNotifyFactory =
  (deps: {
    authorizeResolver: AuthorizeResolver
    getStream: GetStream
    updateStream: UpdateStreamRecord
    addStreamUpdatedActivity: AddStreamUpdatedActivity
  }): UpdateStream =>
  async (
    update: StreamUpdateInput | ProjectUpdateInput,
    updaterId: string,
    updaterResourceAccessRules: ContextResourceAccessRules
  ) => {
    await deps.authorizeResolver(
      updaterId,
      update.id,
      Roles.Stream.Owner,
      updaterResourceAccessRules
    )

    const oldStream = await deps.getStream({ streamId: update.id, userId: updaterId })
    if (!oldStream) {
      throw new StreamUpdateError('Stream not found', {
        info: { updaterId, streamId: update.id }
      })
    }

    const newStream = await deps.updateStream(update)
    if (!newStream) {
      return oldStream
    }

    await deps.addStreamUpdatedActivity({
      streamId: update.id,
      updaterId,
      oldStream,
      newStream,
      update
    })

    return newStream
  }

/**
 * @deprecated Use updateStreamAndNotifyFactory() or the repo fn directly
 */
export const legacyUpdateStreamFactory =
  (deps: { updateStream: UpdateStreamRecord }): LegacyUpdateStream =>
  async (update) => {
    const updatedStream = await deps.updateStream(update)
    return updatedStream?.id || null
  }

const isProjectUpdateRoleInput = (
  i: PermissionUpdateInput
): i is ProjectUpdateRoleInput => has(i, 'projectId')
const isStreamRevokePermissionInput = (
  i: PermissionUpdateInput
): i is StreamRevokePermissionInput => has(i, 'streamId') && !has(i, 'role')

export const updateStreamRoleAndNotifyFactory =
  (deps: {
    isStreamCollaborator: IsStreamCollaborator
    addOrUpdateStreamCollaborator: AddOrUpdateStreamCollaborator
    removeStreamCollaborator: RemoveStreamCollaborator
  }): UpdateStreamRole =>
  async (
    update: PermissionUpdateInput,
    updaterId: string,
    updaterResourceAccessRules: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  ) => {
    const smallestStreamRole = Roles.Stream.Reviewer
    const params = {
      streamId: isProjectUpdateRoleInput(update) ? update.projectId : update.streamId,
      userId: update.userId,
      role:
        isStreamRevokePermissionInput(update) || !update.role
          ? null
          : update.role.toLowerCase() || smallestStreamRole
    }

    if (params.role) {
      // Updating role
      if (!(Object.values(Roles.Stream) as string[]).includes(params.role)) {
        throw new StreamUpdateError('Invalid role specified', {
          info: { params }
        })
      }

      // We only allow changing roles, not adding access - for that the user must use stream invites
      const isCollaboratorAlready = await deps.isStreamCollaborator(
        params.userId,
        params.streamId
      )
      if (!isCollaboratorAlready) {
        throw new StreamUpdateError(
          "Cannot grant permissions to users who aren't collaborators already - invite the user to the stream first"
        )
      }

      return await deps.addOrUpdateStreamCollaborator(
        params.streamId,
        params.userId,
        params.role,
        updaterId,
        updaterResourceAccessRules
      )
    } else {
      return await deps.removeStreamCollaborator(
        params.streamId,
        params.userId,
        updaterId,
        updaterResourceAccessRules
      )
    }
  }

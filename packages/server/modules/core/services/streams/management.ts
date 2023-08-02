import { Roles, wait } from '@speckle/shared'
import {
  addStreamCreatedActivity,
  addStreamDeletedActivity,
  addStreamUpdatedActivity
} from '@/modules/activitystream/services/streamActivity'
import {
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectUpdateRoleInput,
  StreamCreateInput,
  StreamRevokePermissionInput,
  StreamUpdateInput,
  StreamUpdatePermissionInput
} from '@/modules/core/graph/generated/graphql'
import { StreamRecord } from '@/modules/core/helpers/types'
import {
  createStream,
  deleteStream,
  getStream,
  updateStream
} from '@/modules/core/repositories/streams'
import { createBranch } from '@/modules/core/services/branches'
import { inviteUsersToStream } from '@/modules/serverinvites/services/inviteCreationService'
import { StreamUpdateError } from '@/modules/core/errors/stream'
import { isProjectCreateInput } from '@/modules/core/helpers/stream'
import { has } from 'lodash'
import {
  addOrUpdateStreamCollaborator,
  isStreamCollaborator,
  removeStreamCollaborator
} from '@/modules/core/services/streams/streamAccessService'
import { deleteAllStreamInvites } from '@/modules/serverinvites/repositories'

export async function createStreamReturnRecord(
  params: (StreamCreateInput | ProjectCreateInput) & { ownerId: string },
  options?: Partial<{ createActivity: boolean }>
): Promise<StreamRecord> {
  const { ownerId } = params
  const { createActivity = true } = options || {}

  const stream = await createStream(params, { ownerId })
  const streamId = stream.id

  // Create a default main branch
  await createBranch({
    name: 'main',
    description: 'default branch',
    streamId,
    authorId: ownerId
  })

  // Invite contributors?
  if (!isProjectCreateInput(params) && params.withContributors?.length) {
    await inviteUsersToStream(ownerId, streamId, params.withContributors)
  }

  // Save activity
  if (createActivity) {
    await addStreamCreatedActivity({
      streamId,
      input: params,
      stream,
      creatorId: ownerId
    })
  }

  return stream
}

/**
 * Delete stream & notify users (emit events & save activity)
 * @param {string} streamId
 * @param {string} deleterId
 */
export async function deleteStreamAndNotify(streamId: string, deleterId: string) {
  await addStreamDeletedActivity({ streamId, deleterId })

  // TODO: this has been around since before my time, we should get rid of it...
  // delay deletion by a bit so we can do auth checks
  await wait(250)

  // Delete after event so we can do authz
  await Promise.all([deleteAllStreamInvites(streamId), deleteStream(streamId)])
  return true
}

/**
 * Update stream metadata & notify users (emit events & save activity)
 */
export async function updateStreamAndNotify(
  update: StreamUpdateInput | ProjectUpdateInput,
  updaterId: string
) {
  const oldStream = await getStream({ streamId: update.id, userId: updaterId })
  if (!oldStream) {
    throw new StreamUpdateError('Stream not found', {
      info: { updaterId, streamId: update.id }
    })
  }

  const newStream = await updateStream(update)
  if (!newStream) {
    return oldStream
  }

  await addStreamUpdatedActivity({
    streamId: update.id,
    updaterId,
    oldStream,
    newStream,
    update
  })

  return newStream
}

type PermissionUpdateInput =
  | StreamUpdatePermissionInput
  | StreamRevokePermissionInput
  | ProjectUpdateRoleInput

const isProjectUpdateRoleInput = (
  i: PermissionUpdateInput
): i is ProjectUpdateRoleInput => has(i, 'projectId')
const isStreamRevokePermissionInput = (
  i: PermissionUpdateInput
): i is StreamRevokePermissionInput => has(i, 'streamId') && !has(i, 'role')

export async function updateStreamRoleAndNotify(
  update: PermissionUpdateInput,
  updaterId: string
) {
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
    const isCollaboratorAlready = await isStreamCollaborator(
      params.userId,
      params.streamId
    )
    if (!isCollaboratorAlready) {
      throw new StreamUpdateError(
        "Cannot grant permissions to users who aren't collaborators already - invite the user to the stream first"
      )
    }

    return await addOrUpdateStreamCollaborator(
      params.streamId,
      params.userId,
      params.role,
      updaterId
    )
  } else {
    return await removeStreamCollaborator(params.streamId, params.userId, updaterId)
  }
}

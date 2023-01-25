import { wait } from '@speckle/shared'
import {
  addStreamCreatedActivity,
  addStreamDeletedActivity,
  addStreamUpdatedActivity
} from '@/modules/activitystream/services/streamActivity'
import {
  ProjectUpdateInput,
  StreamCreateInput,
  StreamUpdateInput
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

export async function createStreamReturnRecord(
  params: StreamCreateInput & { ownerId: string },
  options?: Partial<{ createActivity: boolean }>
): Promise<StreamRecord> {
  const { ownerId, withContributors } = params
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
  if (withContributors && withContributors.length) {
    await inviteUsersToStream(ownerId, streamId, withContributors)
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
  await deleteStream(streamId)
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

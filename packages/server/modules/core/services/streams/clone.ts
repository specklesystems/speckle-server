import { Optional } from '@speckle/shared'
import { StreamCloneError } from '@/modules/core/errors/stream'
import { UserRecord } from '@/modules/core/helpers/types'
import { getStream, StreamWithOptionalRole } from '@/modules/core/repositories/streams'
import { getUser, UserWithOptionalRole } from '@/modules/core/repositories/users'
import { createStream, deleteStream } from '@/modules/core/services/streams'

/**
 * TODO:
 * - Create empty stream if target not found
 * - Wrap everything in a transaction with the default isolation level, that shouldn't really lock anything?
 * - Create activity item for cloned stream?
 */

type CloneStreamState = {
  user: UserWithOptionalRole<UserRecord>
  targetStream: StreamWithOptionalRole
}

const prepareState = async (
  userId: string,
  sourceStreamId: string
): Promise<CloneStreamState> => {
  const targetStream = await getStream({ streamId: sourceStreamId })
  if (!targetStream) {
    throw new StreamCloneError('Clonable source stream not found', {
      info: { sourceStreamId }
    })
  }

  const user = await getUser(userId)
  if (!user) {
    throw new StreamCloneError('Clone target user not found')
  }

  return { user, targetStream }
}

async function cloneStreamEntity(state: CloneStreamState) {
  const { targetStream, user } = state

  return await createStream({
    name: targetStream.name,
    description: targetStream.description,
    isPublic: targetStream.isPublic,
    isDiscoverable: targetStream.isDiscoverable,
    ownerId: user.id
  })
}

async function safelyClone(state: CloneStreamState) {
  let newStreamId: Optional<string>
  try {
    // Create new stream entity
    newStreamId = await cloneStreamEntity(state)

    // Clone objects
    // Clone commits - switch authors, timestamps
    // - when doing so store map - newCommitId/oldBranchId
    // Create stream_commits references
    // Clone branches - switch authors, streamId, timestamps
    // - when doing so store map oldBranchId/newBranchId
    // Create branch_commits (need to have a map of old commitIds/branchIds)
    // - "newCommitId/oldBranchId" + "oldBranchId/newBranchId" -> "newCommitId/newBranchId"
  } catch (e) {
    if (newStreamId) await deleteStream({ streamId: newStreamId })
    throw e
  }
}

/**
 * Create a new stream that is cloned from another one for the target user.
 * Important note: There are no access checks here, even private streams can be cloned! Do any
 * access control checking before you invoke this function, if needed.
 */
export async function cloneStream(userId: string, sourceStreamId: string) {
  const state = await prepareState(userId, sourceStreamId)
  await safelyClone(state)
}

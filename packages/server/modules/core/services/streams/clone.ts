import { Optional } from '@speckle/shared'
import { StreamCloneError } from '@/modules/core/errors/stream'
import {
  BranchCommitRecord,
  StreamCommitRecord,
  UserRecord
} from '@/modules/core/helpers/types'
import { getStream, StreamWithOptionalRole } from '@/modules/core/repositories/streams'
import { getUser, UserWithOptionalRole } from '@/modules/core/repositories/users'
import { createStream, deleteStream } from '@/modules/core/services/streams'
import {
  getBatchedStreamObjects,
  insertObjects
} from '@/modules/core/repositories/objects'
import {
  getBatchedStreamCommits,
  generateCommitId,
  insertCommits,
  insertStreamCommits,
  getBatchedBranchCommits,
  insertBranchCommits
} from '@/modules/core/repositories/commits'
import { chunk } from 'lodash'
import {
  getBatchedStreamBranches,
  generateBranchId,
  insertBranches
} from '@/modules/core/repositories/branches'
import {
  generateCommentId,
  getBatchedStreamComments,
  getCommentLinks,
  insertComments
} from '@/modules/comments/repositories/comments'

/**
 * TODO:
 * - Create empty stream if target not found
 * - Wrap everything in a transaction with the default isolation level, that shouldn't really lock anything?
 * - Create activity item for cloned stream?
 */

type CloneStreamInitialState = {
  user: UserWithOptionalRole<UserRecord>
  targetStream: StreamWithOptionalRole
}

const prepareState = async (
  userId: string,
  sourceStreamId: string
): Promise<CloneStreamInitialState> => {
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

async function cloneStreamEntity(state: CloneStreamInitialState) {
  const { targetStream, user } = state

  return await createStream({
    name: targetStream.name,
    description: targetStream.description,
    isPublic: targetStream.isPublic,
    isDiscoverable: targetStream.isDiscoverable,
    ownerId: user.id
  })
}

async function cloneStreamObjects(state: CloneStreamInitialState, newStreamId: string) {
  for await (const objectsBatch of getBatchedStreamObjects(state.targetStream.id)) {
    objectsBatch.forEach((o) => {
      o.streamId = newStreamId
      o.createdAt = new Date()
    })

    await insertObjects(objectsBatch)
  }
}

async function cloneCommits(state: CloneStreamInitialState) {
  // oldCommitId/newCommitId
  const commitIdMap = new Map<string, string>()

  for await (const commitsBatch of getBatchedStreamCommits(state.targetStream.id)) {
    commitsBatch.forEach((c) => {
      const oldId = c.id
      c.id = generateCommitId()
      c.author = state.user.id
      c.createdAt = new Date()

      commitIdMap.set(oldId, c.id)
    })

    await insertCommits(commitsBatch)
  }

  return commitIdMap
}

async function createStreamCommitReferences(
  commitIdMap: Map<string, string>,
  newStreamId: string
) {
  const batchSize = 100
  const newCommitIds = [...commitIdMap.values()]
  const batchedNewCommitIds = chunk(newCommitIds, batchSize)

  for (const newCommitIdBatch of batchedNewCommitIds) {
    await insertStreamCommits(
      newCommitIdBatch.map(
        (id): StreamCommitRecord => ({
          streamId: newStreamId,
          commitId: id
        })
      )
    )
  }
}

async function cloneBranches(state: CloneStreamInitialState, newStreamId: string) {
  // oldBranchId/newBranchId
  const branchIdMap = new Map<string, string>()

  for await (const branchesBatch of getBatchedStreamBranches(state.targetStream.id)) {
    branchesBatch.forEach((b) => {
      const oldId = b.id
      const createdDate = new Date()

      b.id = generateBranchId()
      b.streamId = newStreamId
      b.authorId = state.user.id
      b.createdAt = createdDate
      b.updatedAt = createdDate

      branchIdMap.set(oldId, b.id)
    })

    await insertBranches(branchesBatch)
  }

  return branchIdMap
}

async function createBranchCommitReferences(
  commitIdMap: Map<string, string>,
  branchIdMap: Map<string, string>
) {
  const oldBranchIds = [...branchIdMap.values()]
  for await (const branchCommits of getBatchedBranchCommits(oldBranchIds)) {
    const newBranchCommits = branchCommits.map((bc): BranchCommitRecord => {
      const newBranchId = branchIdMap.get(bc.branchId)
      const newCommitId = commitIdMap.get(bc.commitId)
      if (!newBranchId || !newCommitId) {
        throw new StreamCloneError('Unexpected missing branch or commit mapping', {
          info: {
            oldBranchId: bc.branchId,
            newBranchId,
            oldCommitId: bc.commitId,
            newCommitId
          }
        })
      }

      return { commitId: newCommitId, branchId: newBranchId }
    })

    await insertBranchCommits(newBranchCommits)
  }
}

async function cloneStreamCore(state: CloneStreamInitialState) {
  let newStreamId: Optional<string>
  try {
    // Create stream
    newStreamId = await cloneStreamEntity(state)

    // Clone objects
    await cloneStreamObjects(state, newStreamId)

    // Clone commits
    const commitIdMap = await cloneCommits(state)

    // Create stream_commits references
    await createStreamCommitReferences(commitIdMap, newStreamId)

    // Clone branches
    const branchIdMap = await cloneBranches(state, newStreamId)

    // Create branch_commits
    await createBranchCommitReferences(commitIdMap, branchIdMap)

    return { newStreamId, commitIdMap }
  } catch (e) {
    if (newStreamId) await deleteStream({ streamId: newStreamId })
    throw e
  }
}

type CoreStreamCloneResult = Awaited<ReturnType<typeof cloneStreamCore>>

async function cloneComments(
  initialState: CloneStreamInitialState,
  coreResult: CoreStreamCloneResult
) {
  // oldCommentId/newCommentId
  const commentIdMap = new Map<string, string>()

  // First clone parent comments/threads
  const cloneComments = async (threads: boolean) => {
    for await (const commentsBatch of getBatchedStreamComments(
      initialState.targetStream.id,
      {
        withoutParentCommentOnly: threads,
        withParentCommentOnly: !threads
      }
    )) {
      commentsBatch.forEach((c) => {
        const oldId = c.id
        const newDate = new Date()

        c.id = generateCommentId()
        c.streamId = coreResult.newStreamId
        c.createdAt = newDate
        c.updatedAt = newDate

        if (c.parentComment) {
          const newParentComment = commentIdMap.get(c.parentComment)
          if (!newParentComment) {
            throw new StreamCloneError('Unexpected missing comment mapping', {
              info: {
                newStreamId: coreResult.newStreamId,
                oldStreamId: initialState.targetStream.id,
                oldParentCommentId: c.parentComment
              }
            })
          }

          c.parentComment = newParentComment
        }

        commentIdMap.set(oldId, c.id)
      })

      await insertComments(commentsBatch)
    }
  }

  await cloneComments(true)
  await cloneComments(false)

  return commentIdMap
}

async function cloneCommentLinks(
  initialState: CloneStreamInitialState,
  coreResult: CoreStreamCloneResult,
  commentIdMap: Map<string, string>
) {
  const {
    targetStream: { id: oldStreamId }
  } = initialState
  const { commitIdMap, newStreamId } = coreResult

  const batchSize = 100
  const oldCommentIds = [...commentIdMap.keys()]
  const batchedOldCommentIds = chunk(oldCommentIds, batchSize)

  for (const oldCommentIdBatch of batchedOldCommentIds) {
    const commentLinks = await getCommentLinks(oldCommentIdBatch)
    commentLinks.forEach((cl) => {
      const newCommentId = commentIdMap.get(cl.commentId)
      if (newCommentId) {
        throw new StreamCloneError('Mismatched comment_links source comment')
      }

      cl.commentId = newCommentId

      const resourceType = cl.resourceType
      const resourceId = cl.resourceId

      if (resourceType === 'comment') {
        const newTargetCommentId = commentIdMap.get(resourceId)
        if (!newTargetCommentId) {
          throw new StreamCloneError('Mismatched comment_links target comment')
        }

        cl.resourceId = newTargetCommentId
      } else if (resourceType === 'stream') {
        if (resourceId === oldStreamId) {
          cl.resourceId = newStreamId
        }
      } else if (resourceType === 'commit') {
        const newCommitId = commitIdMap.get(resourceId)
        if (!newCommitId) {
          throw new StreamCloneError('Mismatched comment_links target commit')
        }

        cl.resourceId = newCommitId
      }
    })
  }
}

async function cloneStreamComments(
  initialState: CloneStreamInitialState,
  coreResult: CoreStreamCloneResult
) {
  // Clone comments
  const commentIdMap = await cloneComments(initialState, coreResult)

  // Clone comments_links
  await cloneCommentLinks(initialState, coreResult, commentIdMap)
}

/**
 * Create a new stream that is cloned from another one for the target user.
 * Important note: There are no access checks here, even private streams can be cloned! Do any
 * access control checking before you invoke this function, if needed.
 * @returns The ID of the new stream
 */
export async function cloneStream(userId: string, sourceStreamId: string) {
  const state = await prepareState(userId, sourceStreamId)

  // Clone stream/commits/branches/objects
  const coreCloneResult = await cloneStreamCore(state)
  const newStreamId = coreCloneResult.newStreamId

  // Clone comments (if this fails/throws, we can keep the stream, we'll just have some comments missing)
  await cloneStreamComments(state, coreCloneResult)

  return newStreamId
}

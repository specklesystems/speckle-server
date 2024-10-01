import { StreamCloneError } from '@/modules/core/errors/stream'
import {
  BranchCommitRecord,
  StreamCommitRecord,
  UserRecord
} from '@/modules/core/helpers/types'
import {
  createStream,
  getStream,
  StreamWithOptionalRole
} from '@/modules/core/repositories/streams'
import { getUser, UserWithOptionalRole } from '@/modules/core/repositories/users'
import {
  getBatchedStreamObjects,
  insertObjects
} from '@/modules/core/repositories/objects'
import {
  getBatchedStreamCommits,
  generateCommitId,
  insertCommits,
  getBatchedBranchCommits,
  insertStreamCommitsFactory,
  insertBranchCommitsFactory
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
  insertCommentLinksFactory,
  insertCommentsFactory
} from '@/modules/comments/repositories/comments'
import dayjs from 'dayjs'
import { addStreamClonedActivity } from '@/modules/activitystream/services/streamActivity'
import knex, { db } from '@/db/knex'
import { Knex } from 'knex'
import { InsertCommentPayload } from '@/modules/comments/domain/operations'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'

type CloneStreamInitialState = {
  user: UserWithOptionalRole<UserRecord>
  targetStream: StreamWithOptionalRole
  trx: Knex.Transaction
}

/**
 * Our batch inserts are very quick, but this causes many items to have the same created date.This causes issues
 * in our pagination, so this utility is used to make each date instance used comes after the previous one.
 *
 * It may be somewhat inaccurate that we manipulate the date instead of waiting between each insertion,
 * but it's definitely faster and the inaccuracies are very small
 */
const incrementingDateGenerator = () => {
  let date = dayjs()
  return {
    getNewDate: () => {
      date = date.add(1, 'millisecond')
      return date.toDate()
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const decrementingDateGenerator = () => {
  let date = dayjs()
  return {
    getNewDate: () => {
      date = date.subtract(1, 'millisecond')
      return date.toDate()
    }
  }
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

  const trx = await knex.transaction()

  return { user, targetStream, trx }
}

async function cloneStreamEntity(state: CloneStreamInitialState) {
  const { targetStream, user, trx } = state

  const newStream = await createStream(
    {
      name: targetStream.name,
      description: targetStream.description,
      isPublic: targetStream.isPublic,
      isDiscoverable: targetStream.isDiscoverable
    },
    {
      ownerId: user.id,
      trx
    }
  )

  return newStream
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function cloneStreamObjects(state: CloneStreamInitialState, newStreamId: string) {
  const { getNewDate } = incrementingDateGenerator()
  for await (const objectsBatch of getBatchedStreamObjects(state.targetStream.id, {
    trx: state.trx
  })) {
    objectsBatch.forEach((o) => {
      o.streamId = newStreamId
      o.createdAt = getNewDate()
    })

    await insertObjects(objectsBatch, { trx: state.trx })
  }
}

// For sample onboarding stream, goes from 25s to ~250ms vs `cloneStreamObjects`
async function cloneStreamObjectsGrug(
  state: CloneStreamInitialState,
  newStreamId: string
) {
  const query = knex
    .raw(
      `
        INSERT INTO objects ("id", "speckleType", "totalChildrenCount", "totalChildrenCountByDepth", "createdAt", "data", "streamId")
        SELECT
          id,
          objects."speckleType",
          objects."totalChildrenCount",
          objects."totalChildrenCountByDepth",
          objects."createdAt",
          objects."data",
          :newStreamId
        FROM
          objects
        WHERE
          "streamId" = :targetStreamId
      `,
      { newStreamId, targetStreamId: state.targetStream.id }
    )
    .transacting(state.trx)
  await query

  // TODO: closure
}

async function cloneCommits(state: CloneStreamInitialState) {
  // oldCommitId/newCommitId
  const commitIdMap = new Map<string, string>()

  for await (const commitsBatch of getBatchedStreamCommits(state.targetStream.id, {
    trx: state.trx
  })) {
    commitsBatch.forEach((c) => {
      const oldId = c.id
      c.id = generateCommitId()
      c.author = state.user.id

      commitIdMap.set(oldId, c.id)
    })

    await insertCommits(commitsBatch, { trx: state.trx })
  }

  return commitIdMap
}

async function createStreamCommitReferences(
  state: CloneStreamInitialState,
  commitIdMap: Map<string, string>,
  newStreamId: string
) {
  const batchSize = 100
  const newCommitIds = [...commitIdMap.values()]
  const batchedNewCommitIds = chunk(newCommitIds, batchSize)

  for (const newCommitIdBatch of batchedNewCommitIds) {
    await insertStreamCommitsFactory({ db })(
      newCommitIdBatch.map(
        (id): StreamCommitRecord => ({
          streamId: newStreamId,
          commitId: id
        })
      ),
      { trx: state.trx }
    )
  }
}

async function cloneBranches(state: CloneStreamInitialState, newStreamId: string) {
  // oldBranchId/newBranchId
  const branchIdMap = new Map<string, string>()

  const { getNewDate } = incrementingDateGenerator()
  for await (const branchesBatch of getBatchedStreamBranches(state.targetStream.id, {
    trx: state.trx
  })) {
    branchesBatch.forEach((b) => {
      const oldId = b.id
      const createdDate = getNewDate()

      b.id = generateBranchId()
      b.streamId = newStreamId
      b.authorId = state.user.id
      b.createdAt = createdDate
      b.updatedAt = createdDate

      branchIdMap.set(oldId, b.id)
    })

    await insertBranches(branchesBatch, { trx: state.trx })
  }

  return branchIdMap
}

async function createBranchCommitReferences(
  state: CloneStreamInitialState,
  commitIdMap: Map<string, string>,
  branchIdMap: Map<string, string>
) {
  const oldBranchIds = [...branchIdMap.keys()]
  for await (const branchCommits of getBatchedBranchCommits(oldBranchIds, {
    trx: state.trx
  })) {
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

    await insertBranchCommitsFactory({ db })(newBranchCommits, { trx: state.trx })
  }
}

async function cloneStreamCore(state: CloneStreamInitialState) {
  const newStream = await cloneStreamEntity(state)
  const { id: newStreamId } = newStream

  // Clone objects
  await cloneStreamObjectsGrug(state, newStreamId)

  // Clone commits
  const commitIdMap = await cloneCommits(state)

  // Create stream_commits references
  await createStreamCommitReferences(state, commitIdMap, newStreamId)

  // Clone branches
  const branchIdMap = await cloneBranches(state, newStreamId)

  // Create branch_commits
  await createBranchCommitReferences(state, commitIdMap, branchIdMap)
  return { newStreamId, commitIdMap, newStream }
}

type CoreStreamCloneResult = Awaited<ReturnType<typeof cloneStreamCore>>

async function cloneComments(
  state: CloneStreamInitialState,
  coreResult: CoreStreamCloneResult
) {
  // oldCommentId/newCommentId
  const commentIdMap = new Map<string, string>()

  // First clone parent comments/threads
  const { getNewDate } = incrementingDateGenerator()
  const cloneComments = async (threads: boolean) => {
    for await (const commentsBatch of getBatchedStreamComments(state.targetStream.id, {
      withoutParentCommentOnly: threads,
      withParentCommentOnly: !threads,
      trx: state.trx
    })) {
      const finalBatch = commentsBatch.map((c): InsertCommentPayload => {
        const oldId = c.id
        const newDate = getNewDate()

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
                oldStreamId: state.targetStream.id,
                oldParentCommentId: c.parentComment
              }
            })
          }

          c.parentComment = newParentComment
        }

        commentIdMap.set(oldId, c.id)
        return {
          ...c,
          text: c.text as SmartTextEditorValueSchema
        }
      })

      await insertCommentsFactory({ db })(finalBatch, { trx: state.trx })
    }
  }

  await cloneComments(true)
  await cloneComments(false)

  return commentIdMap
}

async function cloneCommentLinks(
  state: CloneStreamInitialState,
  coreResult: CoreStreamCloneResult,
  commentIdMap: Map<string, string>
) {
  const {
    targetStream: { id: oldStreamId },
    trx
  } = state
  const { commitIdMap, newStreamId } = coreResult

  const batchSize = 100
  const oldCommentIds = [...commentIdMap.keys()]
  const batchedOldCommentIds = chunk(oldCommentIds, batchSize)

  for (const oldCommentIdBatch of batchedOldCommentIds) {
    const commentLinks = await getCommentLinks(oldCommentIdBatch, { trx })
    commentLinks.forEach((cl) => {
      const newCommentId = commentIdMap.get(cl.commentId)
      if (!newCommentId) {
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

    await insertCommentLinksFactory({ db })(commentLinks, { trx })
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
  console.time('clone')
  const state = await prepareState(userId, sourceStreamId)
  console.timeLog('clone', 'state prep end')

  try {
    // Clone stream/commits/branches/objects
    const coreCloneResult = await cloneStreamCore(state)
    const { newStream } = coreCloneResult
    // Clone comments
    await cloneStreamComments(state, coreCloneResult)
    // Create activity item
    await addStreamClonedActivity(
      {
        sourceStreamId,
        newStream,
        clonerId: userId
      },
      { trx: state.trx }
    )

    // Commit transaction
    await state.trx.commit()

    return coreCloneResult.newStream
  } catch (e) {
    await state.trx.rollback()
    throw e
  }
}

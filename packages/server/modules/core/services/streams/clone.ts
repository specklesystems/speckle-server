import { StreamCloneError } from '@/modules/core/errors/stream'
import {
  BranchCommitRecord,
  StreamCommitRecord,
  UserRecord
} from '@/modules/core/helpers/types'
import { StreamWithOptionalRole } from '@/modules/core/repositories/streams'
import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import { generateCommitId } from '@/modules/core/repositories/commits'
import { chunk } from 'lodash'
import { generateBranchId } from '@/modules/core/repositories/branches'
import { generateCommentId } from '@/modules/comments/repositories/comments'
import dayjs from 'dayjs'
import { Knex } from 'knex'
import {
  GetBatchedStreamComments,
  GetCommentLinks,
  InsertCommentLinks,
  InsertCommentPayload,
  InsertComments
} from '@/modules/comments/domain/operations'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'

import { addStreamClonedActivityFactory } from '@/modules/activitystream/services/streamActivity'
import {
  CloneStream,
  GetStream,
  StoreStream
} from '@/modules/core/domain/streams/operations'
import {
  GetBatchedStreamObjects,
  StoreObjects
} from '@/modules/core/domain/objects/operations'
import {
  GetBatchedBranchCommits,
  GetBatchedStreamCommits,
  InsertBranchCommits,
  InsertCommits,
  InsertStreamCommits
} from '@/modules/core/domain/commits/operations'
import {
  GetBatchedStreamBranches,
  InsertBranches
} from '@/modules/core/domain/branches/operations'
import { GetUser } from '@/modules/core/domain/users/operations'

type CloneStreamInitialState = {
  user: UserWithOptionalRole<UserRecord>
  targetStream: StreamWithOptionalRole
  /**
   * Target streeam DB TRX for ensuring everything gets properly inserted
   */
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

type PrepareStateDeps = {
  getStream: GetStream
  getUser: GetUser
  newProjectDb: Knex
}

const prepareStateFactory =
  (deps: PrepareStateDeps) =>
  async (userId: string, sourceStreamId: string): Promise<CloneStreamInitialState> => {
    const targetStream = await deps.getStream({ streamId: sourceStreamId })
    if (!targetStream) {
      throw new StreamCloneError('Clonable source stream not found', {
        info: { sourceStreamId }
      })
    }
    if (targetStream.regionKey) {
      throw new StreamCloneError(
        'Cloning of multiregion streams is not currently supported'
      )
    }

    const user = await deps.getUser(userId)
    if (!user) {
      throw new StreamCloneError('Clone target user not found')
    }

    const trx = await deps.newProjectDb.transaction()

    return { user, targetStream, trx }
  }

type CloneStreamEntityDeps = {
  createStream: StoreStream
}

const cloneStreamEntityFactory =
  (deps: CloneStreamEntityDeps) => async (state: CloneStreamInitialState) => {
    const { targetStream, user, trx } = state

    const newStream = await deps.createStream(
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
const cloneStreamObjectsOldFactory =
  (deps: {
    getBatchedStreamObjects: GetBatchedStreamObjects
    insertObjects: StoreObjects
  }) =>
  async (state: CloneStreamInitialState, newStreamId: string) => {
    const { getNewDate } = incrementingDateGenerator()

    for await (const objectsBatch of deps.getBatchedStreamObjects(
      state.targetStream.id,
      {
        trx: state.trx
      }
    )) {
      objectsBatch.forEach((o) => {
        o.streamId = newStreamId
        o.createdAt = getNewDate()
      })

      await deps.insertObjects(objectsBatch, { trx: state.trx })
    }
  }

type CloneStreamObjectsDeps = {
  newProjectDb: Knex
  sourceProjectDb: Knex
}

// For sample onboarding stream, goes from 25s to ~250ms vs `cloneStreamObjectsOld`
// TODO: This kind of query is not supported in multiregion, we can use the old one but apparently its 10 times slower...
const cloneStreamObjectsFactory =
  (deps: CloneStreamObjectsDeps) =>
  async (state: CloneStreamInitialState, newStreamId: string) => {
    const query = deps.sourceProjectDb // same as targetProjectDb for now
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

type CloneCommitsDeps = {
  insertCommits: InsertCommits
  getBatchedStreamCommits: GetBatchedStreamCommits
}

const cloneCommitsFactory =
  (deps: CloneCommitsDeps) => async (state: CloneStreamInitialState) => {
    // oldCommitId/newCommitId
    const commitIdMap = new Map<string, string>()

    for await (const commitsBatch of deps.getBatchedStreamCommits(
      state.targetStream.id,
      {
        trx: state.trx
      }
    )) {
      commitsBatch.forEach((c) => {
        const oldId = c.id
        c.id = generateCommitId()
        c.author = state.user.id

        commitIdMap.set(oldId, c.id)
      })

      await deps.insertCommits(commitsBatch, { trx: state.trx })
    }

    return commitIdMap
  }

type CreateStreamCommitReferencesDeps = {
  insertStreamCommits: InsertStreamCommits
}

const createStreamCommitReferencesFactory =
  (deps: CreateStreamCommitReferencesDeps) =>
  async (
    state: CloneStreamInitialState,
    commitIdMap: Map<string, string>,
    newStreamId: string
  ) => {
    const batchSize = 100
    const newCommitIds = [...commitIdMap.values()]
    const batchedNewCommitIds = chunk(newCommitIds, batchSize)

    for (const newCommitIdBatch of batchedNewCommitIds) {
      await deps.insertStreamCommits(
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

type CloneBranchesDeps = {
  getBatchedStreamBranches: GetBatchedStreamBranches
  insertBranches: InsertBranches
}

const cloneBranchesFactory =
  (deps: CloneBranchesDeps) =>
  async (state: CloneStreamInitialState, newStreamId: string) => {
    // oldBranchId/newBranchId
    const branchIdMap = new Map<string, string>()

    const { getNewDate } = incrementingDateGenerator()
    for await (const branchesBatch of deps.getBatchedStreamBranches(
      state.targetStream.id,
      {
        trx: state.trx
      }
    )) {
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

      await deps.insertBranches(branchesBatch, { trx: state.trx })
    }

    return branchIdMap
  }

type CreateBranchCommitReferencesDeps = {
  getBatchedBranchCommits: GetBatchedBranchCommits
  insertBranchCommits: InsertBranchCommits
}

const createBranchCommitReferencesFactory =
  (deps: CreateBranchCommitReferencesDeps) =>
  async (
    state: CloneStreamInitialState,
    commitIdMap: Map<string, string>,
    branchIdMap: Map<string, string>
  ) => {
    const oldBranchIds = [...branchIdMap.keys()]

    for await (const branchCommits of deps.getBatchedBranchCommits(oldBranchIds, {
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

      await deps.insertBranchCommits(newBranchCommits, { trx: state.trx })
    }
  }

type CloneStreamCoreDeps = CloneStreamEntityDeps &
  CloneStreamObjectsDeps &
  CloneCommitsDeps &
  CreateStreamCommitReferencesDeps &
  CloneBranchesDeps &
  CreateBranchCommitReferencesDeps

const cloneStreamCoreFactory =
  (deps: CloneStreamCoreDeps) => async (state: CloneStreamInitialState) => {
    const newStream = await cloneStreamEntityFactory(deps)(state)
    const { id: newStreamId } = newStream

    // Clone objects
    await cloneStreamObjectsFactory(deps)(state, newStreamId)

    // Clone commits
    const commitIdMap = await cloneCommitsFactory(deps)(state)

    // Create stream_commits references
    await createStreamCommitReferencesFactory(deps)(state, commitIdMap, newStreamId)

    // Clone branches
    const branchIdMap = await cloneBranchesFactory(deps)(state, newStreamId)

    // Create branch_commits
    await createBranchCommitReferencesFactory(deps)(state, commitIdMap, branchIdMap)
    return { newStreamId, commitIdMap, newStream }
  }

type CoreStreamCloneResult = Awaited<
  ReturnType<ReturnType<typeof cloneStreamCoreFactory>>
>

type CloneCommentsDeps = {
  getBatchedStreamComments: GetBatchedStreamComments
  insertComments: InsertComments
}

const cloneCommentsFactory =
  (deps: CloneCommentsDeps) =>
  async (state: CloneStreamInitialState, coreResult: CoreStreamCloneResult) => {
    // oldCommentId/newCommentId
    const commentIdMap = new Map<string, string>()

    // First clone parent comments/threads
    const { getNewDate } = incrementingDateGenerator()
    const cloneComments = async (threads: boolean) => {
      for await (const commentsBatch of deps.getBatchedStreamComments(
        state.targetStream.id,
        {
          withoutParentCommentOnly: threads,
          withParentCommentOnly: !threads,
          trx: state.trx
        }
      )) {
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

        await deps.insertComments(finalBatch, { trx: state.trx })
      }
    }

    await cloneComments(true)
    await cloneComments(false)

    return commentIdMap
  }

type CloneCommentLinksDeps = {
  getCommentLinks: GetCommentLinks
  insertCommentLinks: InsertCommentLinks
}

const cloneCommentLinksFactory =
  (deps: CloneCommentLinksDeps) =>
  async (
    state: CloneStreamInitialState,
    coreResult: CoreStreamCloneResult,
    commentIdMap: Map<string, string>
  ) => {
    const {
      targetStream: { id: oldStreamId },
      trx
    } = state
    const { commitIdMap, newStreamId } = coreResult

    const batchSize = 100
    const oldCommentIds = [...commentIdMap.keys()]
    const batchedOldCommentIds = chunk(oldCommentIds, batchSize)

    for (const oldCommentIdBatch of batchedOldCommentIds) {
      const commentLinks = await deps.getCommentLinks(oldCommentIdBatch, { trx })
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

      await deps.insertCommentLinks(commentLinks, { trx })
    }
  }

type CloneStreamCommentsDeps = CloneCommentsDeps & CloneCommentLinksDeps

const cloneStreamCommentsFactory =
  (deps: CloneStreamCommentsDeps) =>
  async (initialState: CloneStreamInitialState, coreResult: CoreStreamCloneResult) => {
    // Clone comments
    const commentIdMap = await cloneCommentsFactory(deps)(initialState, coreResult)

    // Clone comments_links
    await cloneCommentLinksFactory(deps)(initialState, coreResult, commentIdMap)
  }

/**
 * Create a new stream that is cloned from another one for the target user.
 * Important note: There are no access checks here, even private streams can be cloned! Do any
 * access control checking before you invoke this function, if needed.
 *
 * TODO: Does not currently support multiregion projects because of `cloneStreamObjectsFactory`
 * @returns The ID of the new stream
 */
export const cloneStreamFactory =
  (
    deps: PrepareStateDeps &
      CloneStreamCoreDeps &
      CloneStreamCommentsDeps & {
        addStreamClonedActivity: ReturnType<typeof addStreamClonedActivityFactory>
      }
  ): CloneStream =>
  async (userId: string, sourceStreamId: string) => {
    const state = await prepareStateFactory(deps)(userId, sourceStreamId)

    try {
      // Clone stream/commits/branches/objects
      const coreCloneResult = await cloneStreamCoreFactory(deps)(state)
      const { newStream } = coreCloneResult
      // Clone comments
      await cloneStreamCommentsFactory(deps)(state, coreCloneResult)
      // Create activity item
      await deps.addStreamClonedActivity(
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

import { mainDb } from '@/db/knex'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { addCommitCreatedActivityFactory } from '@/modules/activitystream/services/commitActivity'
import { VersionsEmitter } from '@/modules/core/events/versionsEmitter'
import {
  getBranchByIdFactory,
  getStreamBranchByNameFactory,
  markCommitBranchUpdatedFactory
} from '@/modules/core/repositories/branches'
import {
  createCommitFactory,
  insertBranchCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getObjectFactory,
  storeClosuresIfNotFoundFactory,
  storeSingleObjectIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import { markCommitStreamUpdatedFactory } from '@/modules/core/repositories/streams'
import {
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory
} from '@/modules/core/services/commit/management'
import { createObjectFactory } from '@/modules/core/services/objects/management'
import { publish } from '@/modules/shared/utils/subscriptions'
import { BasicTestUser } from '@/test/authHelper'
import { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { Knex } from 'knex'

export type BasicTestCommit = {
  /**
   * Can be left empty, will be filled on creation
   */
  id: string
  /**
   * Can be left empty, will be filled on creation
   */
  objectId: string
  /**
   * Can be left empty, will be filled on creation if stream passed in
   */
  streamId: string
  /**
   * Can be left empty, will be filled on creation if owner passed in
   */
  authorId: string
  /**
   * Defaults to 'main'
   */
  branchName?: string
  /**
   * Auto-generated, if empty
   */
  message?: string

  /**
   * Empty array by default
   */
  parents?: string[]
}

export async function createTestObject(params: { projectId: string }) {
  const db = mainDb
  const createObject = createObjectFactory({
    storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db }),
    storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db })
  })

  return await createObject({
    streamId: params.projectId,
    object: { foo: 'bar' }
  })
}

const ensureObjectsFactory =
  (deps: { db: Knex }) => async (commits: BasicTestCommit[]) => {
    const { db } = deps
    const createObject = createObjectFactory({
      storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db }),
      storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db })
    })

    const commitsWithoutObjects = commits.filter((c) => !c.objectId)
    await Promise.all(
      commitsWithoutObjects.map((c) =>
        createObject({
          streamId: c.streamId,
          object: { foo: 'bar' }
        }).then((oid) => (c.objectId = oid))
      )
    )
  }

/**
 * Create test commits
 */
export const createTestCommitsFactory =
  (deps: { db: Knex }) =>
  async (
    commits: BasicTestCommit[],
    options?: Partial<{ owner: BasicTestUser; stream: BasicTestStream }>
  ) => {
    const { db } = deps
    const { owner, stream } = options || {}

    const createCommitByBranchId = createCommitByBranchIdFactory({
      createCommit: createCommitFactory({ db }),
      getObject: getObjectFactory({ db }),
      getBranchById: getBranchByIdFactory({ db }),
      insertStreamCommits: insertStreamCommitsFactory({ db }),
      insertBranchCommits: insertBranchCommitsFactory({ db }),
      markCommitStreamUpdated: markCommitStreamUpdatedFactory({ db }),
      markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
      versionsEventEmitter: VersionsEmitter.emit,
      addCommitCreatedActivity: addCommitCreatedActivityFactory({
        saveActivity: saveActivityFactory({ db: mainDb }),
        publish
      })
    })

    const createCommitByBranchName = createCommitByBranchNameFactory({
      createCommitByBranchId,
      getStreamBranchByName: getStreamBranchByNameFactory({ db }),
      getBranchById: getBranchByIdFactory({ db })
    })

    commits.forEach((c) => {
      if (owner) c.authorId = owner.id
      if (stream) c.streamId = stream.id
    })

    await ensureObjectsFactory(deps)(commits)
    await Promise.all(
      commits.map((c) =>
        createCommitByBranchName({
          streamId: c.streamId,
          branchName: c.branchName || 'main',
          message: c.message || 'this message is auto generated',
          sourceApplication: 'tests',
          objectId: c.objectId,
          authorId: c.authorId,
          totalChildrenCount: 0,
          parents: c.parents || []
        }).then((newCommit) => (c.id = newCommit.id))
      )
    )
  }

/**
 * Create test commits
 */
export const createTestCommits = createTestCommitsFactory({ db: mainDb })

export async function createTestCommit(
  commit: BasicTestCommit,
  options?: Partial<{ owner: BasicTestUser; stream: BasicTestStream }>
) {
  await createTestCommits([commit], options)
}

import { createCommitByBranchName } from '@/modules/core/services/commits'
import { createObject } from '@/modules/core/services/objects'
import { BasicTestUser } from '@/test/authHelper'
import { BasicTestStream } from '@/test/speckle-helpers/streamHelper'

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
  return await createObject(params.projectId, { foo: 'bar' })
}

/**
 * Ensure all commits have objectId set
 */
async function ensureObjects(commits: BasicTestCommit[]) {
  const commitsWithoutObjects = commits.filter((c) => !c.objectId)
  await Promise.all(
    commitsWithoutObjects.map((c) =>
      createObject(c.streamId, { foo: 'bar' }).then((oid) => (c.objectId = oid))
    )
  )
}

/**
 * Create test commits
 */
export async function createTestCommits(
  commits: BasicTestCommit[],
  options?: Partial<{ owner: BasicTestUser; stream: BasicTestStream }>
) {
  const { owner, stream } = options || {}

  commits.forEach((c) => {
    if (owner) c.authorId = owner.id
    if (stream) c.streamId = stream.id
  })

  await ensureObjects(commits)
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
      }).then((cid) => (c.id = cid))
    )
  )
}

export async function createTestCommit(
  commit: BasicTestCommit,
  options?: Partial<{ owner: BasicTestUser; stream: BasicTestStream }>
) {
  await createTestCommits([commit], options)
}

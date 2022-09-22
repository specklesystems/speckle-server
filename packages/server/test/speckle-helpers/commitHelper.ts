import { createCommitByBranchName } from '@/modules/core/services/commits'
import { createObject } from '@/modules/core/services/objects'

export type BasicTestCommit = {
  /**
   * Can be left empty, will be filled on creation
   */
  id: string
  /**
   * Can be left empty, will be filled on creation
   */
  objectId: string
  streamId: string
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
export async function createTestCommits(commits: BasicTestCommit[]) {
  await ensureObjects(commits)
  await Promise.all(
    commits.map((c) =>
      createCommitByBranchName({
        streamId: c.streamId,
        branchName: 'main',
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

import { createBranch } from '@/modules/core/services/branches'
import { BasicTestUser } from '@/test/authHelper'
import { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { omit } from 'lodash'

export type BasicTestBranch = {
  name: string
  description?: string
  /**
   * The ID of the stream. Will be filled in by createTestBranch().
   */
  streamId: string
  /**
   * The ID of the owner. Will be filled in by createTestBranch().
   */
  authorId: string

  /**
   * The ID of the branch. Will be filled in by createTestBranch().
   */
  id: string
}

export async function createTestBranch(params: {
  branch: BasicTestBranch
  stream: BasicTestStream
  owner: BasicTestUser
}) {
  const { branch, stream, owner } = params
  branch.streamId = stream.id
  branch.authorId = owner.id

  const id = await createBranch({
    ...omit(branch, ['id']),
    description: branch.description || null
  })
  branch.id = id
}

export async function createTestBranches(
  branches: Array<Parameters<typeof createTestBranch>[0]>
) {
  await Promise.all(branches.map((p) => createTestBranch(p)))
}

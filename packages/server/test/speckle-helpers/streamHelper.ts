import { StreamAcl } from '@/modules/core/dbSchema'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { createStream } from '@/modules/core/services/streams'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { BasicTestUser } from '@/test/authHelper'
import { omit } from 'lodash'

export type BasicTestStream = {
  name: string
  isPublic: boolean
  /**
   * The ID of the owner user. Will be filled in by createTestStream().
   */
  ownerId: string
  /**
   * The ID of the stream. Will be filled in by createTestStream().
   */
  id: string
} & Partial<StreamRecord>

/**
 * Create multiple test streams with their IDs filled in
 */
export async function createTestStreams(
  streamOwnerPairs: [BasicTestStream, BasicTestUser][]
) {
  await Promise.all(streamOwnerPairs.map((p) => createTestStream(p[0], p[1])))
}

/**
 * Create basic stream for testing and update streamObj to have a real ID
 */
export async function createTestStream(
  streamObj: BasicTestStream,
  owner: BasicTestUser
) {
  const id = await createStream({
    ...omit(streamObj, ['id', 'ownerId']),
    ownerId: owner.id
  })
  streamObj.id = id
  streamObj.ownerId = owner.id
}

/**
 * Get the role user has for the specified stream
 */
export async function getUserStreamRole(
  userId: string,
  streamId: string
): Promise<Nullable<string>> {
  const entry = await StreamAcl.knex<StreamAclRecord>()
    .where({
      [StreamAcl.col.resourceId]: streamId,
      [StreamAcl.col.userId]: userId
    })
    .first()

  return entry?.role || null
}

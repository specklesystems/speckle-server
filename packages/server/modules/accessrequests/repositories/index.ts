import { ServerAccessRequests, Streams } from '@/modules/core/dbSchema'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import cryptoRandomString from 'crypto-random-string'

export enum AccessRequestType {
  Stream = 'stream'
}

export type ServerAccessRequestRecord<
  T extends AccessRequestType = AccessRequestType,
  I extends Nullable<string> = Nullable<string>
> = {
  id: string
  requesterId: string
  resourceType: T
  resourceId: I
  createdAt: Date
  updatedAt: Date
}

export type StreamAccessRequestRecord = ServerAccessRequestRecord<
  AccessRequestType.Stream,
  string
>

export const isStreamAccessRequest = (
  req: ServerAccessRequestRecord
): req is StreamAccessRequestRecord =>
  !!(req.resourceId && req.resourceType === AccessRequestType.Stream)

const baseQuery = <
  T extends AccessRequestType = AccessRequestType,
  I extends Nullable<string> = Nullable<string>
>(
  resourceType?: T
) => {
  const q = ServerAccessRequests.knex().select<ServerAccessRequestRecord<T, I>[]>(
    ServerAccessRequests.cols
  )

  if (resourceType) {
    q.where(ServerAccessRequests.col.resourceType, resourceType)
  }

  // validate that resourceId points to a valid resource
  if (resourceType) {
    switch (resourceType) {
      case AccessRequestType.Stream:
        q.innerJoin(Streams.name, Streams.col.id, ServerAccessRequests.col.resourceId)
        break
    }
  }

  return q
}

export const generateId = () => cryptoRandomString({ length: 10 })

export async function getPendingAccessRequests<T extends AccessRequestType>(
  resourceType: T,
  resourceId: string
) {
  if (!resourceId || !resourceType) {
    throw new InvalidArgumentError('Resource type and ID missing')
  }

  const q = baseQuery<T, string>(resourceType)
    .andWhere(ServerAccessRequests.col.resourceId, resourceId)
    .orderBy(ServerAccessRequests.col.createdAt)

  return await q
}

export async function getPendingAccessRequest<
  T extends AccessRequestType = AccessRequestType
>(requestId: string, resourceType?: T) {
  if (!requestId) {
    throw new InvalidArgumentError('Request ID missing')
  }

  const q = baseQuery<T, string>(resourceType)
    .andWhere(ServerAccessRequests.col.id, requestId)
    .first()

  return await q
}

export async function deleteRequestById(requestId: string) {
  if (!requestId) {
    throw new InvalidArgumentError('Request ID missing')
  }

  const q = await ServerAccessRequests.knex()
    .where(ServerAccessRequests.col.id, requestId)
    .del()
  return !!q
}

type AccessRecordInput<
  T extends AccessRequestType = AccessRequestType,
  I extends Nullable<string> = Nullable<string>
> = Omit<ServerAccessRequestRecord<T, I>, 'createdAt' | 'updatedAt'>

export async function createNewRequest<
  T extends AccessRequestType = AccessRequestType,
  I extends Nullable<string> = Nullable<string>
>(input: AccessRecordInput<T, I>) {
  const results = await ServerAccessRequests.knex().insert<
    string,
    ServerAccessRequestRecord<T, I>[]
  >(input, ServerAccessRequests.cols)

  return results[0]
}

export async function getUsersPendingAccessRequest<
  T extends AccessRequestType = AccessRequestType,
  I extends Nullable<string> = Nullable<string>
>(userId: string, resourceType: T, resourceId: I) {
  if (!userId || !resourceType) {
    throw new InvalidArgumentError('User ID or resource type missing')
  }

  const q = baseQuery<T, I>(resourceType)
    .andWhere(ServerAccessRequests.col.requesterId, userId)
    .andWhere(ServerAccessRequests.col.resourceId, resourceId)
    .first()

  return await q
}

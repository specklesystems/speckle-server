import {
  ServerAccessRequests as ServerAccessRequestsSchema,
  Streams as StreamsSchema
} from '@/modules/core/dbSchema'
import { StreamRecord } from '@/modules/core/helpers/types'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import cryptoRandomString from 'crypto-random-string'

const ServerAccessRequests = () =>
  ServerAccessRequestsSchema.knex<ServerAccessRequestRecord[]>()
const Streams = () => StreamsSchema.knex<StreamRecord[]>()

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
  const q = ServerAccessRequests().select<ServerAccessRequestRecord<T, I>[]>(
    ServerAccessRequestsSchema.cols
  )

  if (resourceType) {
    q.where(ServerAccessRequestsSchema.col.resourceType, resourceType)
  }

  // validate that resourceId points to a valid resource
  if (resourceType) {
    switch (resourceType) {
      case AccessRequestType.Stream:
        q.innerJoin(
          Streams.name,
          StreamsSchema.col.id,
          ServerAccessRequestsSchema.col.resourceId
        )
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
    .andWhere(ServerAccessRequestsSchema.col.resourceId, resourceId)
    .orderBy(ServerAccessRequestsSchema.col.createdAt)

  return await q
}

export async function getPendingAccessRequest<
  T extends AccessRequestType = AccessRequestType
>(requestId: string, resourceType?: T) {
  if (!requestId) {
    throw new InvalidArgumentError('Request ID missing')
  }

  const q = baseQuery<T, string>(resourceType)
    .andWhere(ServerAccessRequestsSchema.col.id, requestId)
    .first()

  return await q
}

export async function deleteRequestById(requestId: string) {
  if (!requestId) {
    throw new InvalidArgumentError('Request ID missing')
  }

  const q = await ServerAccessRequests()
    .where(ServerAccessRequestsSchema.col.id, requestId)
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
  const results = await ServerAccessRequests().insert<
    string,
    ServerAccessRequestRecord<T, I>[]
  >(input, ServerAccessRequestsSchema.cols)

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
    .andWhere(ServerAccessRequestsSchema.col.requesterId, userId)
    .andWhere(ServerAccessRequestsSchema.col.resourceId, resourceId)
    .first()

  return await q
}

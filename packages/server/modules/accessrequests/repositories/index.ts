import {
  AccessRecordInput,
  CreateNewRequest,
  DeleteRequestById,
  GetPendingAccessRequest,
  GetPendingAccessRequests,
  GetUsersPendingAccessRequest
} from '@/modules/accessrequests/domain/operations'
import { ServerAccessRequests, Streams } from '@/modules/core/dbSchema'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import cryptoRandomString from 'crypto-random-string'
import { Knex } from 'knex'

const tables = {
  serverAccessRequests: (db: Knex) => db(ServerAccessRequests.name)
}

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

const baseQueryFactory =
  (deps: { db: Knex }) =>
  <
    T extends AccessRequestType = AccessRequestType,
    I extends Nullable<string> = Nullable<string>
  >(
    resourceType?: T
  ) => {
    const q = tables
      .serverAccessRequests(deps.db)
      .select<ServerAccessRequestRecord<T, I>[]>(ServerAccessRequests.cols)

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

export const getPendingAccessRequestsFactory =
  (deps: { db: Knex }): GetPendingAccessRequests =>
  async <T extends AccessRequestType>(resourceType: T, resourceId: string) => {
    if (!resourceId || !resourceType) {
      throw new InvalidArgumentError('Resource type and ID missing')
    }

    const q = baseQueryFactory({ db: deps.db })<T, string>(resourceType)
      .andWhere(ServerAccessRequests.col.resourceId, resourceId)
      .orderBy(ServerAccessRequests.col.createdAt)

    return await q
  }

export const getPendingAccessRequestFactory =
  (deps: { db: Knex }): GetPendingAccessRequest =>
  async <T extends AccessRequestType = AccessRequestType>(
    requestId: string,
    resourceType?: T
  ) => {
    if (!requestId) {
      throw new InvalidArgumentError('Request ID missing')
    }

    const q = baseQueryFactory({ db: deps.db })<T, string>(resourceType)
      .andWhere(ServerAccessRequests.col.id, requestId)
      .first()

    return await q
  }

export const deleteRequestByIdFactory =
  (deps: { db: Knex }): DeleteRequestById =>
  async (requestId: string) => {
    if (!requestId) {
      throw new InvalidArgumentError('Request ID missing')
    }

    const q = await tables
      .serverAccessRequests(deps.db)
      .where(ServerAccessRequests.col.id, requestId)
      .del()
    return !!q
  }

export const createNewRequestFactory =
  (deps: { db: Knex }): CreateNewRequest =>
  async <
    T extends AccessRequestType = AccessRequestType,
    I extends Nullable<string> = Nullable<string>
  >(
    input: AccessRecordInput<T, I>
  ) => {
    const results = await tables
      .serverAccessRequests(deps.db)
      .insert<string, ServerAccessRequestRecord<T, I>[]>(
        input,
        ServerAccessRequests.cols
      )

    return results[0]
  }

export const getUsersPendingAccessRequestFactory =
  (deps: { db: Knex }): GetUsersPendingAccessRequest =>
  async <
    T extends AccessRequestType = AccessRequestType,
    I extends Nullable<string> = Nullable<string>
  >(
    userId: string,
    resourceType: T,
    resourceId: I
  ) => {
    if (!userId || !resourceType) {
      throw new InvalidArgumentError('User ID or resource type missing')
    }

    const q = baseQueryFactory({ db: deps.db })<T, I>(resourceType)
      .andWhere(ServerAccessRequests.col.requesterId, userId)
      .andWhere(ServerAccessRequests.col.resourceId, resourceId)
      .first()

    return await q
  }

import {
  AccessRequestCreationError,
  AccessRequestProcessingError
} from '@/modules/accessrequests/errors'
import { AccessRequestsEmitter } from '@/modules/accessrequests/events/emitter'
import { StreamAccessRequestGraphQLReturn } from '@/modules/accessrequests/helpers/graphTypes'
import {
  AccessRequestType,
  createNewRequestFactory,
  deleteRequestByIdFactory,
  generateId,
  getPendingAccessRequestFactory,
  getPendingAccessRequestsFactory,
  getUsersPendingAccessRequestFactory,
  ServerAccessRequestRecord,
  StreamAccessRequestRecord
} from '@/modules/accessrequests/repositories'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import { Roles, StreamRoles } from '@/modules/core/helpers/mainConstants'
import { getStream } from '@/modules/core/repositories/streams'
import {
  addOrUpdateStreamCollaborator,
  validateStreamAccess
} from '@/modules/core/services/streams/streamAccessService'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { MaybeNullOrUndefined, Nullable } from '@/modules/shared/helpers/typeHelper'
import { db } from '@/db/knex'
import {
  CreateNewRequest,
  GetUserProjectAccessRequest,
  GetUsersPendingAccessRequest,
  GetUserStreamAccessRequest
} from '@/modules/accessrequests/domain/operations'

function buildStreamAccessRequestGraphQLReturn(
  record: ServerAccessRequestRecord<AccessRequestType.Stream, string>
): StreamAccessRequestGraphQLReturn {
  return {
    id: record.id,
    requesterId: record.requesterId,
    streamId: record.resourceId,
    createdAt: record.createdAt
  }
}

export const getUserProjectAccessRequestFactory =
  (deps: {
    getUsersPendingAccessRequest: GetUsersPendingAccessRequest
  }): GetUserProjectAccessRequest =>
  async (
    userId: string,
    projectId: string
  ): Promise<Nullable<StreamAccessRequestRecord>> => {
    const req = await deps.getUsersPendingAccessRequest(
      userId,
      AccessRequestType.Stream,
      projectId
    )
    return req || null
  }

export const getUserStreamAccessRequestFactory =
  (deps: {
    getUserProjectAccessRequest: GetUserProjectAccessRequest
  }): GetUserStreamAccessRequest =>
  async (
    userId: string,
    streamId: string
  ): Promise<Nullable<StreamAccessRequestGraphQLReturn>> => {
    const req = await deps.getUserProjectAccessRequest(userId, streamId)
    if (!req) return null

    return buildStreamAccessRequestGraphQLReturn(req)
  }

/**
 * Create new project access request
 */
export const requestProjectAccessFactory =
  (deps: {
    getUserStreamAccessRequest: GetUserStreamAccessRequest
    getStream: typeof getStream
    createNewRequest: CreateNewRequest
    accessRequestsEmitter: (typeof AccessRequestsEmitter)['emit']
  }) =>
  async (userId: string, projectId: string) => {
    const [stream, existingRequest] = await Promise.all([
      deps.getStream({ userId, streamId: projectId }),
      deps.getUserStreamAccessRequest(userId, projectId)
    ])

    if (existingRequest) {
      throw new AccessRequestCreationError(
        'User already has a pending access request for this resource'
      )
    }

    if (!stream) {
      throw new AccessRequestCreationError(
        "Can't request access to a non-existant resource"
      )
    }

    if (stream.role) {
      throw new AccessRequestCreationError(
        'User already has access to the specified resource'
      )
    }

    const req: StreamAccessRequestRecord = await deps.createNewRequest<
      AccessRequestType.Stream,
      string
    >({
      id: generateId(),
      requesterId: userId,
      resourceType: AccessRequestType.Stream,
      resourceId: projectId
    })

    await deps.accessRequestsEmitter(AccessRequestsEmitter.events.Created, {
      request: req
    })

    return req
  }

/**
 * Create new stream access request
 */
export async function requestStreamAccess(userId: string, streamId: string) {
  const requestProjectAccess = requestProjectAccessFactory({
    getUserStreamAccessRequest: getUserStreamAccessRequestFactory({
      getUserProjectAccessRequest: getUserProjectAccessRequestFactory({
        getUsersPendingAccessRequest: getUsersPendingAccessRequestFactory({ db })
      })
    }),
    getStream,
    createNewRequest: createNewRequestFactory({ db }),
    accessRequestsEmitter: AccessRequestsEmitter.emit
  })
  const req = await requestProjectAccess(userId, streamId)
  return buildStreamAccessRequestGraphQLReturn(req)
}

/**
 * Get pending project access requests
 */
export async function getPendingProjectRequests(
  projectId: string
): Promise<StreamAccessRequestRecord[]> {
  return await getPendingAccessRequestsFactory({ db })(
    AccessRequestType.Stream,
    projectId
  )
}

/**
 * Get pending stream access requests
 */
export async function getPendingStreamRequests(
  streamId: string
): Promise<StreamAccessRequestGraphQLReturn[]> {
  const reqs = await getPendingProjectRequests(streamId)
  return reqs.map(buildStreamAccessRequestGraphQLReturn)
}

/**
 * Accept or decline a pending access request
 */
export async function processPendingStreamRequest(
  userId: string,
  requestId: string,
  accept: boolean,
  role: StreamRoles = Roles.Stream.Contributor,
  resourceAccessRules: MaybeNullOrUndefined<TokenResourceIdentifier[]>
) {
  const req = await getPendingAccessRequestFactory({ db })(
    requestId,
    AccessRequestType.Stream
  )
  if (!req) {
    throw new AccessRequestProcessingError('No request with this ID exists')
  }

  try {
    await validateStreamAccess(
      userId,
      req.resourceId,
      Roles.Stream.Owner,
      resourceAccessRules
    )
  } catch (e: unknown) {
    const err = ensureError(e, 'Stream access validation failed')
    if (err instanceof StreamInvalidAccessError) {
      throw new AccessRequestProcessingError(
        'You must own the stream to process access requests',
        { cause: err }
      )
    } else {
      throw err
    }
  }

  if (accept) {
    await addOrUpdateStreamCollaborator(
      req.resourceId,
      req.requesterId,
      role,
      userId,
      resourceAccessRules
    )
  }

  await deleteRequestByIdFactory({ db })(req.id)

  await AccessRequestsEmitter.emit(AccessRequestsEmitter.events.Finalized, {
    request: req,
    approved: accept ? { role } : undefined,
    finalizedBy: userId
  })

  return req
}

export const processPendingProjectRequest = processPendingStreamRequest

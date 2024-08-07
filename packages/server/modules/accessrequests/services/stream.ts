import {
  AccessRequestCreationError,
  AccessRequestProcessingError
} from '@/modules/accessrequests/errors'
import { AccessRequestsEmitter } from '@/modules/accessrequests/events/emitter'
import { StreamAccessRequestGraphQLReturn } from '@/modules/accessrequests/helpers/graphTypes'
import {
  AccessRequestType,
  createNewRequest,
  deleteRequestById,
  generateId,
  getPendingAccessRequest,
  getPendingAccessRequests,
  getUsersPendingAccessRequest,
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

export async function getUserProjectAccessRequest(
  userId: string,
  projectId: string
): Promise<Nullable<StreamAccessRequestRecord>> {
  const req = await getUsersPendingAccessRequest(
    userId,
    AccessRequestType.Stream,
    projectId
  )
  return req || null
}

export async function getUserStreamAccessRequest(
  userId: string,
  streamId: string
): Promise<Nullable<StreamAccessRequestGraphQLReturn>> {
  const req = await getUserProjectAccessRequest(userId, streamId)
  if (!req) return null

  return buildStreamAccessRequestGraphQLReturn(req)
}

/**
 * Create new project access request
 */
export async function requestProjectAccess(userId: string, projectId: string) {
  const [stream, existingRequest] = await Promise.all([
    getStream({ userId, streamId: projectId }),
    getUserStreamAccessRequest(userId, projectId)
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

  const req = await createNewRequest<AccessRequestType.Stream, string>({
    id: generateId(),
    requesterId: userId,
    resourceType: AccessRequestType.Stream,
    resourceId: projectId
  })

  await AccessRequestsEmitter.emit(AccessRequestsEmitter.events.Created, {
    request: req
  })

  return req
}

/**
 * Create new stream access request
 */
export async function requestStreamAccess(userId: string, streamId: string) {
  const req = await requestProjectAccess(userId, streamId)
  return buildStreamAccessRequestGraphQLReturn(req)
}

/**
 * Get pending project access requests
 */
export async function getPendingProjectRequests(
  projectId: string
): Promise<StreamAccessRequestRecord[]> {
  return await getPendingAccessRequests(AccessRequestType.Stream, projectId)
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
  const req = await getPendingAccessRequest(requestId, AccessRequestType.Stream)
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

  await deleteRequestById(req.id)

  await AccessRequestsEmitter.emit(AccessRequestsEmitter.events.Finalized, {
    request: req,
    approved: accept ? { role } : undefined,
    finalizedBy: userId
  })

  return req
}

export const processPendingProjectRequest = processPendingStreamRequest

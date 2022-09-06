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
  ServerAccessRequestRecord
} from '@/modules/accessrequests/repositories'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import { Roles, StreamRoles } from '@/modules/core/helpers/mainConstants'
import { getStream } from '@/modules/core/repositories/streams'
import {
  addOrUpdateStreamCollaborator,
  validateStreamAccess
} from '@/modules/core/services/streams/streamAccessService'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { Nullable } from '@/modules/shared/helpers/typeHelper'

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

export async function getUserStreamAccessRequest(
  userId: string,
  streamId: string
): Promise<Nullable<StreamAccessRequestGraphQLReturn>> {
  const req = await getUsersPendingAccessRequest(
    userId,
    AccessRequestType.Stream,
    streamId
  )
  if (!req) return null

  return buildStreamAccessRequestGraphQLReturn(req)
}

/**
 * Create new stream access request
 */
export async function requestStreamAccess(userId: string, streamId: string) {
  const [stream, existingRequest] = await Promise.all([
    getStream({ userId, streamId }),
    getUserStreamAccessRequest(userId, streamId)
  ])

  if (existingRequest) {
    throw new AccessRequestCreationError(
      'User already has a pending access request for this stream'
    )
  }

  if (!stream) {
    throw new AccessRequestCreationError(
      "Can't request access to a non-existant stream"
    )
  }

  if (stream.role) {
    throw new AccessRequestCreationError(
      'User already has access to the specified stream'
    )
  }

  const req = await createNewRequest<AccessRequestType.Stream, string>({
    id: generateId(),
    requesterId: userId,
    resourceType: AccessRequestType.Stream,
    resourceId: streamId
  })

  await AccessRequestsEmitter.emit(AccessRequestsEmitter.events.Created, {
    request: req
  })

  return buildStreamAccessRequestGraphQLReturn(req)
}

/**
 * Get pending stream access requests
 */
export async function getPendingStreamRequests(
  streamId: string
): Promise<StreamAccessRequestGraphQLReturn[]> {
  const reqs = await getPendingAccessRequests(AccessRequestType.Stream, streamId)
  return reqs.map(buildStreamAccessRequestGraphQLReturn)
}

/**
 * Accept or decline a pending access request
 */
export async function processPendingStreamRequest(
  userId: string,
  requestId: string,
  accept: boolean,
  role: StreamRoles = Roles.Stream.Contributor
) {
  const req = await getPendingAccessRequest(requestId, AccessRequestType.Stream)
  if (!req) {
    throw new AccessRequestProcessingError('No request with this ID exists')
  }

  try {
    await validateStreamAccess(userId, req.resourceId, Roles.Stream.Owner)
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
    await addOrUpdateStreamCollaborator(req.resourceId, req.requesterId, role, userId)
  }

  await deleteRequestById(req.id)

  await AccessRequestsEmitter.emit(AccessRequestsEmitter.events.Finalized, {
    request: req,
    approved: accept ? { role } : undefined,
    finalizedBy: userId
  })
}

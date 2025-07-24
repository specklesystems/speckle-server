import {
  AccessRequestCreationError,
  AccessRequestProcessingError
} from '@/modules/accessrequests/errors'
import type { StreamAccessRequestGraphQLReturn } from '@/modules/accessrequests/helpers/graphTypes'
import type {
  ServerAccessRequestRecord,
  StreamAccessRequestRecord
} from '@/modules/accessrequests/repositories'
import { AccessRequestType, generateId } from '@/modules/accessrequests/repositories'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import type { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import type { StreamRoles } from '@/modules/core/helpers/mainConstants'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import type {
  MaybeNullOrUndefined,
  Nullable,
  Optional
} from '@/modules/shared/helpers/typeHelper'
import type {
  CreateNewRequest,
  DeleteRequestById,
  GetPendingAccessRequest,
  GetPendingAccessRequests,
  GetPendingProjectRequests,
  GetUserProjectAccessRequest,
  GetUsersPendingAccessRequest,
  GetUserStreamAccessRequest,
  RequestProjectAccess
} from '@/modules/accessrequests/domain/operations'
import type {
  AddOrUpdateStreamCollaborator,
  GetStream,
  ValidateStreamAccess
} from '@/modules/core/domain/streams/operations'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import { AccessRequestEvents } from '@/modules/accessrequests/domain/events'

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
    getStream: GetStream
    createNewRequest: CreateNewRequest
    emitEvent: EventBusEmit
  }): RequestProjectAccess =>
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

    await deps.emitEvent({
      eventName: AccessRequestEvents.Created,
      payload: {
        request: req
      }
    })

    return req
  }

/**
 * Create new stream access request
 */
export const requestStreamAccessFactory =
  (deps: { requestProjectAccess: RequestProjectAccess }) =>
  async (userId: string, streamId: string) => {
    const req = await deps.requestProjectAccess(userId, streamId)
    return buildStreamAccessRequestGraphQLReturn(req)
  }

/**
 * Get pending project access requests
 */
export const getPendingProjectRequestsFactory =
  (deps: {
    getPendingAccessRequests: GetPendingAccessRequests
  }): GetPendingProjectRequests =>
  async (projectId: string): Promise<StreamAccessRequestRecord[]> => {
    return await deps.getPendingAccessRequests(AccessRequestType.Stream, projectId)
  }

/**
 * Get pending stream access requests
 */
export const getPendingStreamRequestsFactory =
  (deps: { getPendingProjectRequests: GetPendingProjectRequests }) =>
  async (streamId: string): Promise<StreamAccessRequestGraphQLReturn[]> => {
    const reqs = await deps.getPendingProjectRequests(streamId)
    return reqs.map(buildStreamAccessRequestGraphQLReturn)
  }

/**
 * Accept or decline a pending access request
 */
export const processPendingStreamRequestFactory =
  (deps: {
    getPendingAccessRequest: GetPendingAccessRequest
    validateStreamAccess: ValidateStreamAccess
    addOrUpdateStreamCollaborator: AddOrUpdateStreamCollaborator
    deleteRequestById: DeleteRequestById
    emitEvent: EventBusEmit
  }) =>
  async (
    userId: string,
    requestId: string,
    accept: boolean,
    role: StreamRoles = Roles.Stream.Contributor,
    resourceAccessRules: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  ) => {
    const req: Optional<StreamAccessRequestRecord> = await deps.getPendingAccessRequest(
      requestId,
      AccessRequestType.Stream
    )
    if (!req) {
      throw new AccessRequestProcessingError('No request with this ID exists')
    }

    try {
      await deps.validateStreamAccess(
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
      await deps.addOrUpdateStreamCollaborator(
        req.resourceId,
        req.requesterId,
        role,
        userId,
        resourceAccessRules
      )
    }

    await deps.deleteRequestById(req.id)

    await deps.emitEvent({
      eventName: AccessRequestEvents.Finalized,
      payload: {
        request: req,
        approved: accept ? { role } : undefined,
        finalizedBy: userId
      }
    })

    return req
  }

export const processPendingProjectRequest = processPendingStreamRequestFactory

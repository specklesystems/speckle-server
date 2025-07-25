import { db } from '@/db/knex'
import {
  AccessRequestType,
  createNewRequestFactory,
  deleteRequestByIdFactory,
  getPendingAccessRequestFactory,
  getPendingAccessRequestsFactory,
  getUsersPendingAccessRequestFactory
} from '@/modules/accessrequests/repositories'
import {
  getPendingProjectRequestsFactory,
  getPendingStreamRequestsFactory,
  getUserProjectAccessRequestFactory,
  getUserStreamAccessRequestFactory,
  processPendingStreamRequestFactory,
  requestProjectAccessFactory,
  requestStreamAccessFactory
} from '@/modules/accessrequests/services/stream'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { mapStreamRoleToValue } from '@/modules/core/helpers/graphTypes'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  getStreamFactory,
  getStreamRolesFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import { LogicError } from '@/modules/shared/errors'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { withOperationLogging } from '@/observability/domain/businessLogging'

const getUser = getUserFactory({ db })
const getStream = getStreamFactory({ db })
const getUserProjectAccessRequest = getUserProjectAccessRequestFactory({
  getUsersPendingAccessRequest: getUsersPendingAccessRequestFactory({ db })
})

const getUserStreamAccessRequest = getUserStreamAccessRequestFactory({
  getUserProjectAccessRequest
})

const requestProjectAccess = requestProjectAccessFactory({
  getUserStreamAccessRequest,
  getStream,
  createNewRequest: createNewRequestFactory({ db }),
  emitEvent: getEventBus().emit
})

const requestStreamAccess = requestStreamAccessFactory({
  requestProjectAccess
})

const getPendingProjectRequests = getPendingProjectRequestsFactory({
  getPendingAccessRequests: getPendingAccessRequestsFactory({ db })
})

const getPendingStreamRequests = getPendingStreamRequestsFactory({
  getPendingProjectRequests
})

const validateStreamAccess = validateStreamAccessFactory({
  authorizeResolver
})
const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  getStreamRoles: getStreamRolesFactory({ db }),
  emitEvent: getEventBus().emit
})

const processPendingStreamRequest = processPendingStreamRequestFactory({
  getPendingAccessRequest: getPendingAccessRequestFactory({ db }),
  validateStreamAccess,
  addOrUpdateStreamCollaborator,
  deleteRequestById: deleteRequestByIdFactory({ db }),
  emitEvent: getEventBus().emit
})

const processPendingProjectRequest = processPendingStreamRequest

const resolvers: Resolvers = {
  Mutation: {
    async streamAccessRequestUse(_parent, args, ctx) {
      const { userId, resourceAccessRules } = ctx
      const { requestId, accept, role } = args

      if (!userId) throw new LogicError('User ID unexpectedly false')

      await processPendingStreamRequest(
        userId,
        requestId,
        accept,
        mapStreamRoleToValue(role),
        resourceAccessRules
      )
      return true
    },
    async streamAccessRequestCreate(_parent, args, ctx) {
      const { userId } = ctx
      if (!userId) throw new LogicError('User ID unexpectedly false')

      const { streamId } = args
      const logger = ctx.log.child({
        streamId,
        projectId: streamId
      })
      return await withOperationLogging(
        async () => await requestStreamAccess(userId, streamId),
        {
          logger,
          operationName: 'requestStreamAccess',
          operationDescription: 'Request for stream access'
        }
      )
    }
  },
  ProjectMutations: {
    accessRequestMutations: () => ({})
  },
  ProjectAccessRequestMutations: {
    async create(_parent, args, ctx) {
      const { userId } = ctx
      const { projectId } = args
      const logger = ctx.log.child({
        projectId,
        streamId: projectId // for legacy compatibility
      })
      return await withOperationLogging(
        async () => await requestProjectAccess(userId!, projectId),
        {
          logger,
          operationName: 'CreateProjectAccessRequest',
          operationDescription: 'Create a request for project access'
        }
      )
    },
    async use(_parent, args, ctx) {
      const { userId, resourceAccessRules } = ctx
      const { requestId, accept, role } = args
      const logger = ctx.log

      const usedReq = await withOperationLogging(
        async () =>
          await processPendingProjectRequest(
            userId!,
            requestId,
            accept,
            mapStreamRoleToValue(role),
            resourceAccessRules
          ),

        {
          logger,
          operationName: 'ProcessProjectAccessRequest',
          operationDescription: 'Use a request for project access'
        }
      )

      const project = await ctx.loaders.streams.getStream.load(usedReq.resourceId)
      if (!project) {
        throw new LogicError('Unexpectedly unable to find request project')
      }

      return project
    }
  },
  Query: {
    async streamAccessRequest(_, args, ctx) {
      const { streamId } = args
      const { userId } = ctx
      if (!userId) throw new LogicError('User ID unexpectedly false')

      return await getUserStreamAccessRequest(userId, streamId)
    }
  },
  User: {
    async projectAccessRequest(parent, args) {
      const { id: userId } = parent
      const { projectId } = args

      return await getUserProjectAccessRequest(userId, projectId)
    }
  },
  Stream: {
    async pendingAccessRequests(parent) {
      const { id } = parent
      return await getPendingStreamRequests(id)
    }
  },
  Project: {
    async pendingAccessRequests(parent) {
      const { id } = parent
      return await getPendingProjectRequests(id)
    }
  },
  StreamAccessRequest: {
    async requester(parent, _args, ctx) {
      const { requesterId } = parent
      const user = await ctx.loaders.users.getUser.load(requesterId)
      if (!user) {
        throw new LogicError('Unable to find requester')
      }

      return user
    },
    async stream(parent, _args, ctx) {
      const { streamId } = parent
      const stream = await ctx.loaders.streams.getStream.load(streamId)

      if (!stream) {
        throw new LogicError('Unable to find request stream')
      }

      await validateStreamAccess(
        ctx.userId,
        stream.id,
        Roles.Stream.Reviewer,
        ctx.resourceAccessRules
      )

      return stream
    }
  },
  ProjectAccessRequest: {
    async requester(parent, _args, ctx) {
      const { requesterId } = parent
      const user = await ctx.loaders.users.getUser.load(requesterId)
      if (!user) {
        throw new LogicError('Unable to find requester')
      }

      return user
    },
    async projectId(parent) {
      const { resourceId, resourceType } = parent
      if (resourceType !== AccessRequestType.Stream) {
        throw new LogicError('Unexpectedly returned invalid resource type')
      }

      return resourceId
    },
    async project(parent, _args, ctx) {
      const { resourceId, resourceType } = parent
      if (resourceType !== AccessRequestType.Stream) {
        throw new LogicError('Unexpectedly returned invalid resource type')
      }

      const project = await ctx.loaders.streams.getStream.load(resourceId)
      if (!project) {
        throw new LogicError('Unable to find request project')
      }

      await validateStreamAccess(
        ctx.userId,
        project.id,
        Roles.Stream.Reviewer,
        ctx.resourceAccessRules
      )

      return project
    }
  }
}

export default resolvers

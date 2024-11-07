import { db } from '@/db/knex'
import { AccessRequestsEmitter } from '@/modules/accessrequests/events/emitter'
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
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { mapStreamRoleToValue } from '@/modules/core/helpers/graphTypes'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  getStreamFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import { LogicError } from '@/modules/shared/errors'
import { publish } from '@/modules/shared/utils/subscriptions'

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
  accessRequestsEmitter: AccessRequestsEmitter.emit
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

const saveActivity = saveActivityFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({
  authorizeResolver
})
const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  addStreamInviteAcceptedActivity: addStreamInviteAcceptedActivityFactory({
    saveActivity,
    publish
  }),
  addStreamPermissionsAddedActivity: addStreamPermissionsAddedActivityFactory({
    saveActivity,
    publish
  })
})

const processPendingStreamRequest = processPendingStreamRequestFactory({
  getPendingAccessRequest: getPendingAccessRequestFactory({ db }),
  validateStreamAccess,
  addOrUpdateStreamCollaborator,
  deleteRequestById: deleteRequestByIdFactory({ db }),
  accessRequestsEmitter: AccessRequestsEmitter.emit
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
      return await requestStreamAccess(userId, streamId)
    }
  },
  ProjectMutations: {
    accessRequestMutations: () => ({})
  },
  ProjectAccessRequestMutations: {
    async create(_parent, args, ctx) {
      const { userId } = ctx
      const { projectId } = args
      return await requestProjectAccess(userId!, projectId)
    },
    async use(_parent, args, ctx) {
      const { userId, resourceAccessRules } = ctx
      const { requestId, accept, role } = args

      const usedReq = await processPendingProjectRequest(
        userId!,
        requestId,
        accept,
        mapStreamRoleToValue(role),
        resourceAccessRules
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

export = resolvers

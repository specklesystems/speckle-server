import {
  getPendingStreamRequests,
  getUserStreamAccessRequest,
  processPendingStreamRequest,
  requestStreamAccess
} from '@/modules/accessrequests/services/stream'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { mapStreamRoleToValue } from '@/modules/core/helpers/graphTypes'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { validateStreamAccess } from '@/modules/core/services/streams/streamAccessService'
import { LogicError } from '@/modules/shared/errors'

const resolvers: Resolvers = {
  Mutation: {
    async streamAccessRequestUse(_parent, args, ctx) {
      const { userId } = ctx
      const { requestId, accept, role } = args

      if (!userId) throw new LogicError('User ID unexpectedly false')

      await processPendingStreamRequest(
        userId,
        requestId,
        accept,
        mapStreamRoleToValue(role)
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
  Query: {
    async streamAccessRequest(_, args, ctx) {
      const { streamId } = args
      const { userId } = ctx
      if (!userId) throw new LogicError('User ID unexpectedly false')

      return await getUserStreamAccessRequest(userId, streamId)
    }
  },
  Stream: {
    async pendingAccessRequests(parent) {
      const { id } = parent
      return await getPendingStreamRequests(id)
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

      if (!stream.isPublic) {
        await validateStreamAccess(ctx.userId, stream.id, Roles.Stream.Reviewer)
      }

      return stream
    }
  }
}

export = resolvers

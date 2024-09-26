import { db } from '@/db/knex'
import { ActionTypes } from '@/modules/activitystream/helpers/types'
import {
  getActivityCountByResourceIdFactory,
  getActivityCountByStreamIdFactory,
  getActivityCountByUserIdFactory,
  getResourceActivityFactory,
  getStreamActivityFactory,
  getTimelineCountFactory,
  getUserActivityFactory,
  getUserTimelineFactory
} from '@/modules/activitystream/repositories'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { InvalidActionTypeError } from '@/modules/activitystream/errors/activityStream'
import { StreamActionType } from '@/modules/activitystream/domain/types'
import { md5 } from '@/modules/shared/helpers/cryptoHelper'

type ActivityPaginatedArgs = {
  actionType?: string | null
  after?: Date | null
  before?: Date | null
  cursor?: Date | null
  limit?: number // This field is required because the type-defs defines it as required
}

const userActivityQueryCore = async (
  parent: { id: string },
  args: ActivityPaginatedArgs
) => {
  const { items, cursor } = await getUserActivityFactory({ db })({
    userId: parent.id,
    actionType: (args.actionType as StreamActionType) ?? undefined,
    after: args.after ?? undefined,
    before: args.before ?? undefined,
    cursor: args.cursor ?? undefined,
    limit: args.limit
  })
  const totalCount = await getActivityCountByUserIdFactory({ db })({
    userId: parent.id,
    actionType: (args.actionType as StreamActionType) ?? undefined,
    after: args.after ?? undefined,
    before: args.before ?? undefined
  })

  return { items, cursor, totalCount }
}

const userTimelineQueryCore = async (
  parent: { id: string },
  args: ActivityPaginatedArgs
) => {
  const { items, cursor } = await getUserTimelineFactory({ db })({
    userId: parent.id,
    after: args.after ?? undefined,
    before: args.before ?? undefined,
    cursor: args.cursor ?? undefined,
    limit: args.limit
  })
  const totalCount = await getTimelineCountFactory({ db })({
    userId: parent.id,
    after: args.after ?? undefined,
    before: args.before ?? undefined
  })

  return { items, cursor, totalCount }
}

export = {
  LimitedUser: {
    async activity(parent, args) {
      return await userActivityQueryCore(parent, args)
    },

    async timeline(parent, args) {
      return await userTimelineQueryCore(parent, args)
    }
  },
  User: {
    async activity(parent, args) {
      return await userActivityQueryCore(parent, args)
    },

    async timeline(parent, args) {
      return await userTimelineQueryCore(parent, args)
    }
  },
  Stream: {
    async activity(parent, args) {
      if (
        args.actionType &&
        !Object.values(ActionTypes.Stream).includes(args.actionType as StreamActionType)
      ) {
        throw new InvalidActionTypeError()
      }

      const { items, cursor } = await getStreamActivityFactory({ db })({
        streamId: parent.id,
        actionType: (args.actionType as StreamActionType) ?? undefined,
        after: args.after ?? undefined,
        before: args.before ?? undefined,
        cursor: args.cursor ?? undefined,
        limit: args.limit ?? undefined
      })
      const totalCount = await getActivityCountByStreamIdFactory({ db })({
        streamId: parent.id,
        actionType: (args.actionType as StreamActionType) ?? undefined,
        after: args.after ?? undefined,
        before: args.before ?? undefined
      })

      return { items, cursor, totalCount }
    }
  },
  Commit: {
    async activity(parent, args) {
      const { items, cursor } = await getResourceActivityFactory({ db })({
        resourceType: 'commit',
        resourceId: parent.id,
        actionType: (args.actionType as StreamActionType) ?? undefined,
        after: args.after ?? undefined,
        before: args.before ?? undefined,
        cursor: args.cursor ?? undefined,
        limit: args.limit ?? undefined
      })
      const totalCount = await getActivityCountByResourceIdFactory({ db })({
        resourceId: parent.id,
        actionType: (args.actionType as StreamActionType) ?? undefined,
        after: args.after ?? undefined,
        before: args.before ?? undefined
      })

      return { items, cursor, totalCount }
    }
  },
  Branch: {
    async activity(parent, args) {
      const { items, cursor } = await getResourceActivityFactory({ db })({
        resourceType: 'branch',
        resourceId: parent.id,
        actionType: (args.actionType as StreamActionType) ?? undefined,
        after: args.after ?? undefined,
        before: args.before ?? undefined,
        cursor: args.cursor ?? undefined,
        limit: args.limit
      })
      const totalCount = await getActivityCountByResourceIdFactory({ db })({
        resourceId: parent.id,
        actionType: (args.actionType as StreamActionType) ?? undefined,
        after: args.after ?? undefined,
        before: args.before ?? undefined
      })

      return { items, cursor, totalCount }
    }
  },
  Activity: {
    /**
     * We need a unique ID to be able to properly cache stuff on the clientside
     */
    id(parent) {
      if (!parent) return null
      const { streamId, resourceId, userId, time } = parent
      const plainIdentity = JSON.stringify({
        streamId,
        resourceId,
        userId,
        time
      })

      return md5(plainIdentity)
    }
  }
} as Resolvers

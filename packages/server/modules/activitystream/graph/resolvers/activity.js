'use strict'
const { md5 } = require('@/modules/shared/helpers/cryptoHelper')
const {
  getUserActivity,
  getResourceActivity,
  getUserTimeline,
  getActivityCountByResourceId,
  getTimelineCount
} = require('../../services/index')
const {
  getActivityCountByUserIdFactory
} = require('@/modules/activitystream/repositories')
const { db } = require('@/db/knex')

const userActivityQueryCore = async (parent, args) => {
  const { items, cursor } = await getUserActivity({
    userId: parent.id,
    actionType: args.actionType,
    after: args.after,
    before: args.before,
    cursor: args.cursor,
    limit: args.limit
  })
  const totalCount = await getActivityCountByUserIdFactory({ db })({
    userId: parent.id,
    actionType: args.actionType,
    after: args.after,
    before: args.before
  })

  return { items, cursor, totalCount }
}

const userTimelineQueryCore = async (parent, args) => {
  const { items, cursor } = await getUserTimeline({
    userId: parent.id,
    after: args.after,
    before: args.before,
    cursor: args.cursor,
    limit: args.limit
  })
  const totalCount = await getTimelineCount({
    userId: parent.id,
    after: args.after,
    before: args.before
  })

  return { items, cursor, totalCount }
}

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
module.exports = {
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

  Branch: {
    async activity(parent, args) {
      const { items, cursor } = await getResourceActivity({
        resourceType: 'branch',
        resourceId: parent.id,
        actionType: args.actionType,
        after: args.after,
        before: args.before,
        cursor: args.cursor,
        limit: args.limit
      })
      const totalCount = await getActivityCountByResourceId({
        resourceId: parent.id,
        actionType: args.actionType,
        after: args.after,
        before: args.before
      })

      return { items, cursor, totalCount }
    }
  },

  Commit: {
    async activity(parent, args) {
      const { items, cursor } = await getResourceActivity({
        resourceType: 'commit',
        resourceId: parent.id,
        actionType: args.actionType,
        after: args.after,
        before: args.before,
        cursor: args.cursor,
        limit: args.limit
      })
      const totalCount = await getActivityCountByResourceId({
        resourceId: parent.id,
        actionType: args.actionType,
        after: args.after,
        before: args.before
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
}

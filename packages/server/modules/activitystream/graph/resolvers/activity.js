'use strict'
const { md5 } = require('@/modules/shared/helpers/cryptoHelper')
const { getUserActivity } = require('../../services/index')
const {
  getActivityCountByUserIdFactory,
  getTimelineCountFactory,
  getUserTimelineFactory
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
  const { items, cursor } = await getUserTimelineFactory({ db })({
    userId: parent.id,
    after: args.after,
    before: args.before,
    cursor: args.cursor,
    limit: args.limit
  })
  const totalCount = await getTimelineCountFactory({ db })({
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

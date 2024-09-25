import { db } from '@/db/knex'
import { ActionTypes } from '@/modules/activitystream/helpers/types'
import {
  getActivityCountByStreamIdFactory,
  getStreamActivityFactory
} from '@/modules/activitystream/repositories'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { InvalidActionTypeError } from '@/modules/activitystream/errors/activityStream'
import { StreamActionType } from '@/modules/activitystream/domain/types'

export = {
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
  }
} as Resolvers

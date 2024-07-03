import { authorizeResolver } from '@/modules/shared'

import {
  createObjects,
  getObjectChildren,
  getObjectChildrenQuery
} from '../../services/objects'

import { Roles } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getObject } from '@/modules/core/repositories/objects'

const getStreamObject: NonNullable<Resolvers['Stream']>['object'] =
  async function object(parent, args) {
    return (await getObject(args.id, parent.id)) || null
  }

export = {
  Stream: {
    object: getStreamObject
  },
  Project: {
    object: getStreamObject
  },
  Object: {
    async children(parent, args) {
      // The simple query branch
      if (!args.query && !args.orderBy) {
        const result = await getObjectChildren({
          streamId: parent.streamId,
          objectId: parent.id,
          limit: args.limit,
          depth: args.depth,
          select: args.select,
          cursor: args.cursor
        })
        result.objects.forEach((x) => (x.streamId = parent.streamId))
        return {
          totalCount: parent.totalChildrenCount || 0,
          cursor: result.cursor,
          objects: result.objects
        }
      }

      // The complex query branch
      const result = await getObjectChildrenQuery({
        streamId: parent.streamId,
        objectId: parent.id,
        limit: args.limit,
        depth: args.depth,
        select: args.select,
        query: args.query,
        orderBy: args.orderBy,
        cursor: args.cursor
      })
      result.objects.forEach((x) => (x.streamId = parent.streamId))
      return result
    }
  },
  Mutation: {
    async objectCreate(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.objectInput.streamId,
        Roles.Stream.Contributor,
        context.resourceAccessRules
      )

      const ids = await createObjects(
        args.objectInput.streamId,
        args.objectInput.objects
      )
      return ids
    }
  }
} as Resolvers

import { authorizeResolver } from '@/modules/shared'

import { getObjectChildrenQuery } from '@/modules/core/services/objects'

import { isNonNullable, Roles } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getObjectChildrenFactory,
  getObjectFactory,
  storeClosuresIfNotFoundFactory,
  storeObjectsIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import { db } from '@/db/knex'
import { createObjectsFactory } from '@/modules/core/services/objects/management'

const getObject = getObjectFactory({ db })
const createObjects = createObjectsFactory({
  storeObjectsIfNotFoundFactory: storeObjectsIfNotFoundFactory({ db }),
  storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db })
})
const getObjectChildren = getObjectChildrenFactory({ db })

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
          select: args.select?.filter(isNonNullable),
          cursor: args.cursor
        })

        const objects: Array<
          (typeof result)['objects'][number] & { streamId: string }
        > = result.objects.map((x) => ({
          ...x,
          streamId: parent.streamId
        }))

        return {
          totalCount: parent.totalChildrenCount || 0,
          cursor: result.cursor,
          objects
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

      const ids = await createObjects({
        streamId: args.objectInput.streamId,
        objects: args.objectInput.objects.filter(isNonNullable)
      })
      return ids
    }
  }
} as Resolvers

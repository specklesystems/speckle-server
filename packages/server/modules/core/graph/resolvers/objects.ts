import { authorizeResolver } from '@/modules/shared'
import { isNonNullable, Roles } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getObjectChildrenFactory,
  getObjectChildrenQueryFactory,
  getObjectFactory,
  storeClosuresIfNotFoundFactory,
  storeObjectsIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import { createObjectsFactory } from '@/modules/core/services/objects/management'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'

type GetObjectChildrenQueryParams = Parameters<
  ReturnType<typeof getObjectChildrenQueryFactory>
>[0]

const getStreamObject: NonNullable<Resolvers['Stream']>['object'] =
  async function object(parent, args) {
    return (
      (await getObjectFactory({
        db: await getProjectDbClient({ projectId: parent.id })
      })(args.id, parent.id)) || null
    )
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
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      // The simple query branch
      if (!args.query && !args.orderBy) {
        const getObjectChildren = getObjectChildrenFactory({ db: projectDB })
        const result = await getObjectChildren({
          streamId: parent.streamId,
          objectId: parent.id,
          limit: args.limit,
          depth: args.depth,
          select: args.select?.filter(isNonNullable),
          cursor: args.cursor
        })

        // Hacky typing here, but I want to avoid filling up memory with a new array of new objects w/ .map()
        const objects = result.objects as Array<
          (typeof result)['objects'][number] & {
            streamId: string
          }
        >
        objects.forEach((x) => (x.streamId = parent.streamId))

        return {
          totalCount: parent.totalChildrenCount || 0,
          cursor: result.cursor,
          objects
        }
      }

      const getObjectChildrenQuery = getObjectChildrenQueryFactory({ db: projectDB })
      // The complex query branch
      const result = await getObjectChildrenQuery({
        streamId: parent.streamId,
        objectId: parent.id,
        limit: args.limit,
        depth: args.depth,
        select: args.select?.filter(isNonNullable),
        // TODO: Theoretically users can feed in invalid structures here
        query: args.query?.filter(
          isNonNullable
        ) as GetObjectChildrenQueryParams['query'],
        orderBy: (args.orderBy || undefined) as GetObjectChildrenQueryParams['orderBy'],
        cursor: args.cursor
      })

      // Hacky typing here, but I want to avoid filling up memory with a new array of new objects w/ .map()
      const objects = result.objects as Array<
        (typeof result)['objects'][number] & {
          streamId: string
        }
      >
      objects.forEach((x) => (x.streamId = parent.streamId))

      return {
        ...result,
        objects
      }
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

      const projectDB = await getProjectDbClient({
        projectId: args.objectInput.streamId
      })
      const createObjects = createObjectsFactory({
        storeObjectsIfNotFoundFactory: storeObjectsIfNotFoundFactory({ db: projectDB }),
        storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db: projectDB })
      })
      const ids = await createObjects({
        streamId: args.objectInput.streamId,
        objects: args.objectInput.objects.filter(isNonNullable)
      })
      return ids
    }
  }
} as Resolvers

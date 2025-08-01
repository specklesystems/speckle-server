import { authorizeResolver } from '@/modules/shared'
import { isNonNullable, Roles } from '@speckle/shared'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getObjectChildrenFactory,
  getObjectChildrenQueryFactory,
  getObjectFactory,
  storeObjectsIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import { createObjectsFactory } from '@/modules/core/services/objects/management'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import coreModule from '@/modules/core'
import { withOperationLogging } from '@/observability/domain/businessLogging'

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

export default {
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
      const projectId = args.objectInput.streamId

      await authorizeResolver(
        context.userId,
        args.objectInput.streamId,
        Roles.Stream.Contributor,
        context.resourceAccessRules
      )

      const logger = context.log.child({
        projectId,
        streamId: projectId //legacy
      })

      await coreModule.executeHooks?.('onCreateObjectRequest', {
        projectId
      })

      const projectDB = await getProjectDbClient({
        projectId
      })
      const createObjects = createObjectsFactory({
        storeObjectsIfNotFoundFactory: storeObjectsIfNotFoundFactory({ db: projectDB })
      })
      const ids = await withOperationLogging(
        async () =>
          await createObjects({
            streamId: projectId,
            objects: args.objectInput.objects.filter(isNonNullable)
          }),
        {
          logger,
          operationName: 'objectCreate',
          operationDescription: `Create one or more new objects`
        }
      )
      return ids
    }
  }
} as Resolvers

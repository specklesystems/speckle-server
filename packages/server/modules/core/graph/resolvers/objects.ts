'use strict'
import { validateScopes, authorizeResolver } from '@/modules/shared'
import {
  createObjects,
  getObject,
  getObjectChildren,
  getObjectChildrenQuery
} from '@/modules/core/services/objects'
import { Roles, Scopes } from '@speckle/shared'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import { Resolvers } from '@/modules/core/graph/generated/graphql'

export = {
  Stream: {
    async object(parent, args) {
      const obj = await getObject({ streamId: parent.id, objectId: args.id })
      if (!obj) return null

      obj.streamId = parent.id
      return obj
    }
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
          totalCount: parent.totalChildrenCount,
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
      await throwForNotHavingServerRole(context, Roles.Server.Guest)
      await validateScopes(context.scopes, Scopes.Streams.Write)
      await authorizeResolver(
        context.userId,
        args.objectInput.streamId,
        Roles.Stream.Contributor
      )

      const ids = await createObjects(
        args.objectInput.streamId,
        args.objectInput.objects
      )
      return ids
    }
  }
} as Resolvers

import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { authorizeResolver } from '@/modules/shared'
import {
  createWebhook,
  deleteWebhook,
  updateWebhook
} from '@/modules/webhooks/services/webhooks-new'
import { Roles } from '@speckle/shared'
import {
  countWebhooksByStreamIdFactory,
  createWebhookFactory,
  deleteWebhookFactory,
  getStreamWebhooksFactory,
  getWebhookByIdFactory,
  updateWebhookFactory
} from '@/modules/webhooks/repositories/webhooks'
import { db } from '@/db/knex'
import { ForbiddenError } from '@/modules/shared/errors'
import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'

const streamWebhooksResolver = async (
  parent: { id: string },
  args: { id?: string },
  context: { resourceAccessRules?: TokenResourceIdentifier[] | null; userId: string }
) => {
  await authorizeResolver(
    context.userId,
    parent.id,
    Roles.Stream.Owner,
    context.resourceAccessRules
  )

  if (args.id) {
    const wh = await getWebhookByIdFactory({ db })({ id: args.id })
    const items = wh ? [wh] : []
    return { items, totalCount: items.length }
  }

  const items = await getStreamWebhooksFactory({ db })({ streamId: parent.id })
  return { items, totalCount: items.length }
}

export = {
  Webhook: {
    projectId: (parent) => parent.streamId,
    hasSecret: (parent) => !!parent.secret?.length
  },
  Stream: {
    webhooks: streamWebhooksResolver
  },
  Project: {
    webhooks: streamWebhooksResolver
  },
  Mutation: {
    webhookCreate: async (_parent, args, context) => {
      await authorizeResolver(
        context.userId,
        args.webhook.streamId,
        Roles.Stream.Owner,
        context.resourceAccessRules
      )

      const id = await createWebhook({
        createWebhookConfig: createWebhookFactory({ db }),
        countWebhooksByStreamId: countWebhooksByStreamIdFactory({ db })
      })({
        streamId: args.webhook.streamId,
        url: args.webhook.url,
        description: args.webhook.description,
        secret: args.webhook.secret,
        enabled: args.webhook.enabled !== false,
        triggers: args.webhook.triggers
      })

      return id
    },
    webhookUpdate: async (_parent, args, context) => {
      await authorizeResolver(
        context.userId,
        args.webhook.streamId,
        Roles.Stream.Owner,
        context.resourceAccessRules
      )

      const wh = await getWebhookByIdFactory({ db })({ id: args.webhook.id })
      if (args.webhook.streamId !== wh?.streamId)
        throw new ForbiddenError(
          'The webhook id and stream id do not match. Please check your inputs.'
        )

      const updated = await updateWebhook({
        updateWebhookConfig: updateWebhookFactory({ db })
      })({
        id: args.webhook.id,
        url: args.webhook.url,
        description: args.webhook.description,
        secret: args.webhook.secret,
        enabled: args.webhook.enabled !== false,
        triggers: args.webhook.triggers
      })

      return updated
    },
    webhookDelete: async (_parent, args, context) => {
      await authorizeResolver(
        context.userId,
        args.webhook.streamId,
        Roles.Stream.Owner,
        context.resourceAccessRules
      )

      return await deleteWebhook({
        deleteWebhookConfig: deleteWebhookFactory({ db }),
        getWebhookById: getWebhookByIdFactory({ db })
      })(args.webhook)
    }
  }
} as Resolvers

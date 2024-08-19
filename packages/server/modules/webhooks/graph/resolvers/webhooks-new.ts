import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { authorizeResolver } from '@/modules/shared'
import { createWebhook } from '@/modules/webhooks/services/webhooks-new'
import { Roles } from '@speckle/shared'
import {
  countWebhooksByStreamIdFactory,
  createWebhookFactory
} from '@/modules/webhooks/repositories/webhooks'
import { db } from '@/db/knex'

export = {
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
    }
  }
} as Resolvers

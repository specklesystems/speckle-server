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
  getWebhookByIdFactory,
  updateWebhookFactory
} from '@/modules/webhooks/repositories/webhooks'
import { db } from '@/db/knex'
import { ForbiddenError } from '@/modules/shared/errors'

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

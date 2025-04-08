import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { authorizeResolver } from '@/modules/shared'
import {
  createWebhookFactory,
  deleteWebhookFactory,
  updateWebhookFactory
} from '@/modules/webhooks/services/webhooks'
import { Authz, Roles } from '@speckle/shared'
import {
  countWebhooksByStreamIdFactory,
  createWebhookConfigFactory,
  deleteWebhookConfigFactory,
  getLastWebhookEventsFactory,
  getStreamWebhooksFactory,
  getWebhookByIdFactory,
  getWebhookEventsCountFactory,
  updateWebhookConfigFactory
} from '@/modules/webhooks/repositories/webhooks'
import { ForbiddenError } from '@/modules/shared/errors'
import {
  TokenResourceIdentifier,
  TokenResourceIdentifierType
} from '@/modules/core/domain/tokens/types'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'

const streamWebhooksResolver = async (
  parent: { id: string },
  args: { id?: string },
  context: {
    resourceAccessRules?: TokenResourceIdentifier[] | null
    userId: string
    authPolicies: Authz.AuthPolicies
  }
) => {
  throwIfResourceAccessNotAllowed({
    resourceId: parent.id,
    resourceType: TokenResourceIdentifierType.Project,
    resourceAccessRules: context.resourceAccessRules
  })

  const canReadWebhooks = await context.authPolicies.project.canReadWebhooks({
    projectId: parent.id,
    userId: context.userId
  })
  throwIfAuthNotOk(canReadWebhooks)

  const projectDb = await getProjectDbClient({ projectId: parent.id })

  if (args.id) {
    const wh = await getWebhookByIdFactory({ db: projectDb })({ id: args.id })
    const items = wh ? [wh] : []
    return { items, totalCount: items.length }
  }

  const items = await getStreamWebhooksFactory({ db: projectDb })({
    streamId: parent.id
  })
  return { items, totalCount: items.length }
}

export = {
  Webhook: {
    projectId: (parent) => parent.streamId,
    hasSecret: (parent) => !!parent.secret?.length,
    history: async (parent, args) => {
      const projectDb = await getProjectDbClient({ projectId: parent.streamId })

      const items = await getLastWebhookEventsFactory({ db: projectDb })({
        webhookId: parent.id,
        limit: args.limit
      })
      const totalCount = await getWebhookEventsCountFactory({ db: projectDb })({
        webhookId: parent.id
      })

      return { items, totalCount }
    }
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
      const projectDb = await getProjectDbClient({ projectId: args.webhook.streamId })

      const id = await createWebhookFactory({
        createWebhookConfig: createWebhookConfigFactory({ db: projectDb }),
        countWebhooksByStreamId: countWebhooksByStreamIdFactory({ db: projectDb })
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

      const projectDb = await getProjectDbClient({ projectId: args.webhook.streamId })

      const wh = await getWebhookByIdFactory({ db: projectDb })({ id: args.webhook.id })
      if (args.webhook.streamId !== wh?.streamId)
        throw new ForbiddenError(
          'The webhook id and stream id do not match. Please check your inputs.'
        )

      const updated = await updateWebhookFactory({
        updateWebhookConfig: updateWebhookConfigFactory({ db: projectDb })
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

      const projectDb = await getProjectDbClient({ projectId: args.webhook.streamId })

      return await deleteWebhookFactory({
        deleteWebhookConfig: deleteWebhookConfigFactory({ db: projectDb }),
        getWebhookById: getWebhookByIdFactory({ db: projectDb })
      })(args.webhook)
    }
  }
} as Resolvers

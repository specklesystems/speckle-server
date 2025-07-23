import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { authorizeResolver } from '@/modules/shared'
import {
  createWebhookFactory,
  deleteWebhookFactory,
  updateWebhookFactory
} from '@/modules/webhooks/services/webhooks'
import type { Authz } from '@speckle/shared'
import { Roles } from '@speckle/shared'
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
import type { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { withOperationLogging } from '@/observability/domain/businessLogging'

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

export default {
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
      const projectId = args.webhook.streamId
      await authorizeResolver(
        context.userId,
        projectId,
        Roles.Stream.Owner,
        context.resourceAccessRules
      )

      const logger = context.log.child({
        projectId,
        streamId: projectId //legacy
      })

      const projectDb = await getProjectDbClient({ projectId })
      const createWebhook = createWebhookFactory({
        createWebhookConfig: createWebhookConfigFactory({ db: projectDb }),
        countWebhooksByStreamId: countWebhooksByStreamIdFactory({ db: projectDb })
      })

      const id = await withOperationLogging(
        async () =>
          await createWebhook({
            streamId: projectId,
            url: args.webhook.url,
            description: args.webhook.description,
            secret: args.webhook.secret,
            enabled: args.webhook.enabled !== false,
            triggers: args.webhook.triggers
          }),
        {
          logger,
          operationName: 'webhookCreate',
          operationDescription: 'Create a new webhook'
        }
      )

      return id
    },
    webhookUpdate: async (_parent, args, context) => {
      const projectId = args.webhook.streamId
      const webhookId = args.webhook.id
      await authorizeResolver(
        context.userId,
        projectId,
        Roles.Stream.Owner,
        context.resourceAccessRules
      )

      const logger = context.log.child({
        projectId,
        streamId: projectId, //legacy
        webhookId
      })

      const projectDb = await getProjectDbClient({ projectId })

      const wh = await getWebhookByIdFactory({ db: projectDb })({ id: args.webhook.id })
      if (args.webhook.streamId !== wh?.streamId)
        throw new ForbiddenError(
          'The webhook id and stream id do not match. Please check your inputs.'
        )

      const updateWebhook = updateWebhookFactory({
        updateWebhookConfig: updateWebhookConfigFactory({ db: projectDb })
      })

      const updated = await withOperationLogging(
        async () =>
          await updateWebhook({
            id: args.webhook.id,
            url: args.webhook.url,
            description: args.webhook.description,
            secret: args.webhook.secret,
            enabled: args.webhook.enabled !== false,
            triggers: args.webhook.triggers
          }),
        {
          logger,
          operationName: 'webhookUpdate',
          operationDescription: 'Update an existing webhook'
        }
      )

      return updated
    },
    webhookDelete: async (_parent, args, context) => {
      const projectId = args.webhook.streamId
      const webhookId = args.webhook.id
      await authorizeResolver(
        context.userId,
        projectId,
        Roles.Stream.Owner,
        context.resourceAccessRules
      )

      const logger = context.log.child({
        projectId,
        streamId: projectId, //legacy
        webhookId
      })

      const projectDb = await getProjectDbClient({ projectId })

      const deleteWebhook = deleteWebhookFactory({
        deleteWebhookConfig: deleteWebhookConfigFactory({ db: projectDb }),
        getWebhookById: getWebhookByIdFactory({ db: projectDb })
      })

      return await withOperationLogging(async () => await deleteWebhook(args.webhook), {
        logger,
        operationName: 'webhookDelete',
        operationDescription: 'Delete an existing webhook'
      })
    }
  }
} as Resolvers

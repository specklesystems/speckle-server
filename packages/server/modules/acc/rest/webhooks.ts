import {
  queryAllAccSyncItemsFactory,
  upsertAccSyncItemFactory
} from '@/modules/acc/repositories/accSyncItems'
import { onVersionAddedFactory } from '@/modules/acc/services/webhooks'
import { sessionMiddlewareFactory } from '@/modules/auth/middleware'
import { logger } from '@/observability/logging'
import type { Express } from 'express'
import { z } from 'zod'
import { db } from '@/db/knex'

export const accWebhooks = (app: Express) => {
  const sessionMiddleware = sessionMiddlewareFactory()
  app.post('/api/v1/acc/webhook/callback', sessionMiddleware, async (req, res) => {
    logger.info({ hook: req.body?.hook, payload: req.body?.payload })
    switch (req.body?.hook.event) {
      case 'dm.version.added': {
        // https://aps.autodesk.com/en/docs/webhooks/v1/reference/events/data_management_events/dm.version.added/
        const payload = z
          .object({
            lineageUrn: z.string(),
            version: z.string().transform((value) => Number.parseInt(value)),
            source: z.string()
          })
          .parse(req.body?.payload)

        const onVersionAdded = onVersionAddedFactory({
          queryAllAccSyncItems: queryAllAccSyncItemsFactory({ db }),
          upsertAccSyncItem: upsertAccSyncItemFactory({ db })
        })

        await onVersionAdded({
          fileLineageUrn: payload.lineageUrn,
          fileVersionUrn: payload.source,
          fileVersionIndex: payload.version
        })

        break
      }
      default: {
        logger.error(
          { event: req.body?.hook.event },
          'Failed to handle unknown ACC webhook event {event}'
        )
        res.status(500).send()
        return
      }
    }

    res.status(200).send()
  })
}

import {
  queryAllAccSyncItemsFactory,
  updateAccSyncItemStatusFactory
} from '@/modules/acc/repositories/accSyncItems'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { db } from '@/db/knex'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  getAutomationFactory,
  getLatestAutomationRevisionFactory,
  upsertAutomationRunFactory,
  getAutomationTokenFactory
} from '@/modules/automate/repositories/automations'
import {
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import { TIME_MS } from '@speckle/shared'
import { AccSyncItemStatuses } from '@/modules/acc/domain/acc/constants'
import { triggerSyncItemAutomationFactory } from '@/modules/acc/services/automate'

const queryAllAccSyncItems = queryAllAccSyncItemsFactory({ db })

export const schedulePendingSyncItemsCheck = (deps: {
  scheduleExecution: ScheduleExecution
}) => {
  const callback = async () => {
    for await (const items of queryAllAccSyncItems({
      filter: { status: AccSyncItemStatuses.pending }
    })) {
      for (const syncItem of items) {
        const projectDb = await getProjectDbClient({ projectId: syncItem.projectId })

        await triggerSyncItemAutomationFactory({
          updateAccSyncItemStatus: updateAccSyncItemStatusFactory({ db }),
          getAutomation: getAutomationFactory({ db: projectDb }),
          getLatestAutomationRevision: getLatestAutomationRevisionFactory({
            db: projectDb
          }),
          upsertAutomationRun: upsertAutomationRunFactory({ db: projectDb }),
          createAppToken: createAppTokenFactory({
            storeApiToken: storeApiTokenFactory({ db }),
            storeTokenScopes: storeTokenScopesFactory({ db }),
            storeTokenResourceAccessDefinitions:
              storeTokenResourceAccessDefinitionsFactory({
                db
              }),
            storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
          }),
          getAutomationToken: getAutomationTokenFactory({
            db: projectDb
          })
        })({
          id: syncItem.id
        })
      }
    }
  }

  return deps.scheduleExecution(
    '*/1 * * * *',
    'pendingAccSyncItemsCheck',
    callback,
    15 * TIME_MS.minute
  )
}

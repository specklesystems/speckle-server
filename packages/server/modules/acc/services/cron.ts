import {
  queryAllPendingAccSyncItemsFactory,
  upsertAccSyncItemFactory
} from '@/modules/acc/repositories/accSyncItems'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { db } from '@/db/knex'
import { getManifestByUrn, getToken } from '@/modules/acc/clients/autodesk'
import { isReadyForImport } from '@/modules/acc/domain/logic'
import type { Logger } from '@/observability/logging'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { ImporterAutomateFunctions } from '@/modules/acc/domain/constants'
import { DefaultAppIds } from '@/modules/auth/defaultApps'
import { triggerAutomationRun } from '@/modules/automate/clients/executionEngine'
import type { VersionCreatedTriggerManifest } from '@/modules/automate/helpers/types'
import type { InsertableAutomationRun } from '@/modules/automate/repositories/automations'
import {
  getAutomationFactory,
  getLatestAutomationRevisionFactory,
  upsertAutomationRunFactory,
  getAutomationTokenFactory
} from '@/modules/automate/repositories/automations'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import {
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import {
  getAutodeskIntegrationClientId,
  getAutodeskIntegrationClientSecret
} from '@/modules/shared/helpers/envHelper'
import { Scopes, TIME_MS } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import type { AccRegion } from '@/modules/acc/domain/types'

const queryAllPendingAccSyncItems = queryAllPendingAccSyncItemsFactory({ db })
const upsertAccSyncItem = upsertAccSyncItemFactory({ db })

export const schedulePendingSyncItemsCheck = (deps: {
  scheduleExecution: ScheduleExecution
}) => {
  const callback = async (_now: Date, { logger }: { logger: Logger }) => {
    const tokenData = await getToken()
    for await (const items of queryAllPendingAccSyncItems()) {
      for (const syncItem of items) {
        const manifest = await getManifestByUrn(
          {
            urn: syncItem.accFileVersionUrn,
            region: syncItem.accRegion as AccRegion
          },
          { token: tokenData.access_token }
        )
        const isReady = isReadyForImport(manifest)

        logger.info(
          { isReady, syncItem, manifest },
          'Checking pending sync item {syncItem.id} for import readiness.'
        )

        if (!isReady) continue

        await upsertAccSyncItem({
          ...syncItem,
          status: 'SYNCING'
        })

        const projectDb = await getProjectDbClient({ projectId: syncItem.projectId })

        const automation = await getAutomationFactory({ db: projectDb })({
          automationId: syncItem.automationId
        })

        if (!automation || !automation.executionEngineAutomationId) continue

        const automationRevision = await getLatestAutomationRevisionFactory({
          db: projectDb
        })({ automationId: syncItem.automationId })

        if (!automationRevision) continue

        const runId = cryptoRandomString({ length: 15 })

        const runData: InsertableAutomationRun = {
          id: runId,
          automationRevisionId: automationRevision.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'pending',
          executionEngineRunId: null,
          triggers: [
            {
              // TODO ACC: This is not meaningful until we integrate with fileUpload
              triggeringId: '',
              triggerType: 'versionCreation'
            }
          ],
          functionRuns: [
            {
              id: cryptoRandomString({ length: 15 }),
              functionId: ImporterAutomateFunctions.svf2.functionId,
              functionReleaseId: ImporterAutomateFunctions.svf2.functionId,
              status: 'pending' as const,
              elapsed: 0,
              results: null,
              contextView: null,
              statusMessage: null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }

        await upsertAutomationRunFactory({ db: projectDb })(runData)

        const projectScopedToken = await createAppTokenFactory({
          storeApiToken: storeApiTokenFactory({ db }),
          storeTokenScopes: storeTokenScopesFactory({ db }),
          storeTokenResourceAccessDefinitions:
            storeTokenResourceAccessDefinitionsFactory({
              db
            }),
          storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
        })({
          appId: DefaultAppIds.Automate,
          name: `acct-${syncItem.id}`,
          userId: syncItem.authorId,
          scopes: [
            Scopes.Profile.Read,
            Scopes.Streams.Read,
            Scopes.Streams.Write,
            Scopes.Automate.ReportResults
          ],
          limitResources: [
            {
              id: syncItem.projectId,
              type: TokenResourceIdentifierType.Project
            }
          ]
        })

        const automationToken = await getAutomationTokenFactory({ db: projectDb })(
          syncItem.automationId
        )

        if (!automationToken) continue

        await triggerAutomationRun({
          projectId: syncItem.projectId,
          automationId: automation.executionEngineAutomationId,
          functionRuns: runData.functionRuns.map((r) => ({
            ...r,
            runId: cryptoRandomString({ length: 15 }),
            resultVersions: [],
            functionInputs: {
              projectId: syncItem.projectId,
              modelId: syncItem.modelId,
              autodeskUrn: syncItem.accFileVersionUrn,
              autodeskRegion: syncItem.accRegion === 'EMEA' ? 1 : 0,
              autodeskClientId: getAutodeskIntegrationClientId(),
              autodeskClientSecret: getAutodeskIntegrationClientSecret()
            }
          })),
          manifests: [
            {
              triggerType: 'versionCreation',
              modelId: syncItem.modelId,
              versionId: cryptoRandomString({ length: 9 })
            } as VersionCreatedTriggerManifest
          ],
          speckleToken: projectScopedToken,
          automationToken: automationToken.automateToken
        })
      }
    }
  }

  return deps.scheduleExecution(
    '*/5 * * * *',
    'pendingAccSyncItemsCheck',
    callback,
    15 * TIME_MS.minute
  )
}

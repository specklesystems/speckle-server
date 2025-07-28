/* eslint-disable camelcase */
import { createAccOidcFlow } from '@/modules/acc/helpers/oidcHelper'
import { sessionMiddlewareFactory } from '@/modules/auth/middleware'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/observability/logging'
import type { Express } from 'express'
import { db } from '@/db/knex'
import {
  queryAllPendingAccSyncItemsFactory,
  upsertAccSyncItemFactory
} from '@/modules/acc/repositories/accSyncItems'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { Scopes, TIME_MS } from '@speckle/shared'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { AccSyncItems } from '@/modules/acc/dbSchema'
import type { AccSyncItem } from '@/modules/acc/domain/types'
import type { InsertableAutomationRun } from '@/modules/automate/repositories/automations'
import {
  getAutomationFactory,
  getAutomationTokenFactory,
  getLatestAutomationRevisionFactory,
  upsertAutomationRunFactory
} from '@/modules/automate/repositories/automations'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import cryptoRandomString from 'crypto-random-string'
import { triggerAutomationRun } from '@/modules/automate/clients/executionEngine'
import { DefaultAppIds } from '@/modules/auth/defaultApps'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import {
  getAutodeskIntegrationClientId,
  getAutodeskIntegrationClientSecret,
  getFeatureFlags,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import type { VersionCreatedTriggerManifest } from '@/modules/automate/helpers/types'
import { getManifestByUrn } from '@/modules/acc/clients/autodesk'
import { isReadyForImport } from '@/modules/acc/domain/logic'
import { ImporterAutomateFunctions } from '@/modules/acc/domain/constants'

export function accRestApi(app: Express) {
  const sessionMiddleware = sessionMiddlewareFactory()
  app.post('/auth/acc/login', sessionMiddleware, async (req, res) => {
    const { projectId } = req.body
    req.session.projectId = projectId

    const accFlow = createAccOidcFlow()
    const { codeVerifier, codeChallenge } = accFlow.generateCodeVerifier()
    req.session.codeVerifier = codeVerifier

    const redirectUri = `${getServerOrigin()}/auth/acc/callback`

    console.log({ redirectUri })

    const authorizeUrl = accFlow.buildAuthorizeUrl({
      clientId: '5Y2LzxsL3usaD1xAMyElBY8mcN6XKyfHfulZDV3up0jfhN5Y',
      redirectUri,
      codeChallenge,
      scopes: ['user-profile:read', 'data:read', 'viewables:read', 'openid']
    })

    return res.json({ authorizeUrl })
  })

  app.get('/auth/acc/callback', sessionMiddleware, async (req, res) => {
    const { code } = req.query
    const codeVerifier = req.session.codeVerifier

    if (!code || !codeVerifier) {
      return res.status(400).send({ error: 'Missing code or verifier' })
    }

    const accFlow = createAccOidcFlow()
    try {
      const tokens = await accFlow.exchangeCodeForTokens({
        code: String(code),
        codeVerifier,
        clientId: '5Y2LzxsL3usaD1xAMyElBY8mcN6XKyfHfulZDV3up0jfhN5Y',
        clientSecret:
          'qHyGqaP4zCWLyS2lp04qBDOC1giIupPzJPmLFKGFHKZrPYYpan27zF8vlhQr1RYL',
        redirectUri: `${getServerOrigin()}/auth/acc/callback`
      })

      req.session.accTokens = tokens

      return res.redirect(`/projects/${req.session.projectId}/acc`)
    } catch (error) {
      console.error('Token exchange failed:', error)
      return res.status(500).send({ error: 'Token exchange failed' })
    }
  })

  app.get('/auth/acc/status', sessionMiddleware, (req, res) => {
    if (!req.session.accTokens) {
      return res.status(404).send({ error: 'No ACC tokens found' })
    }
    res.send(req.session.accTokens)
  })

  app.post('/auth/acc/refresh', sessionMiddleware, async (req, res) => {
    const { refresh_token } = req.session.accTokens || {}
    if (!refresh_token) {
      return res.status(401).json({ error: 'No refresh token found' })
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: '5Y2LzxsL3usaD1xAMyElBY8mcN6XKyfHfulZDV3up0jfhN5Y',
        client_secret:
          'qHyGqaP4zCWLyS2lp04qBDOC1giIupPzJPmLFKGFHKZrPYYpan27zF8vlhQr1RYL',
        refresh_token
      })

      const response = await fetch(
        'https://developer.api.autodesk.com/authentication/v2/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        }
      )

      if (!response.ok) {
        console.error(await response.text())
        return res.status(500).json({ error: 'Failed to refresh token' })
      }

      const newTokens = await response.json()
      req.session.accTokens = newTokens

      res.json(newTokens)
    } catch (error) {
      console.error('Error refreshing token:', error)
      res.status(500).json({ error: 'Error refreshing token' })
    }
  })

  // Registered ACC webhooks are handled here
  // https://aps.autodesk.com/en/docs/webhooks/v1/reference/events/data_management_events/dm.version.added/
  app.post('/api/v1/acc/webhook/callback', sessionMiddleware, async (req, res) => {
    const lineageUrn = req.body?.payload?.lineageUrn

    if (!lineageUrn) {
      console.warn('Webhook received without lineageUrn')
      return res.status(400).send({ error: 'Missing lineageUrn' })
    }

    const accFileVersionIndex = Number.parseInt(req.body?.payload?.version ?? '0')
    const accFileVersionUrn = req.body?.payload?.source

    // TODO ACC: need to know when svf2 is generated, whether with timeout or a webhook that unknown for now

    try {
      // TODO: Multiple references to same item?

      const affectedRows = await db<AccSyncItem>('acc_sync_items')
        .where({ accFileLineageId: lineageUrn })
        .andWhere(AccSyncItems.col.accFileVersionIndex, '<', accFileVersionIndex)
        .update({
          status: 'PENDING',
          accFileVersionIndex,
          accFileVersionUrn
        })
        .returning('*')

      if (affectedRows.length > 0) {
        console.log(
          `✅ Updated ${affectedRows.length} item(s) with lineageUrn ${lineageUrn} to INITIALIZING`
          // TODO ACC: trigger automation and update status of sync item (as in createAccSyncItemAndNotifyFactory)
        )
      } else {
        console.log(`⚠️ No acc_sync_items matched lineageUrn ${lineageUrn}`)
      }

      res.status(200).send('OK')
    } catch (err) {
      console.error('❌ Failed to update acc_sync_items:', err)
      res.status(500).send({ error: 'DB update failed' })
    }
  })
}

let scheduledTask: ReturnType<ScheduleExecution> | null = null

const schedulePendingAccSyncItemsPoll = () => {
  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db }),
    releaseTaskLock: releaseTaskLockFactory({ db })
  })

  return scheduleExecution(
    '*/5 * * * *',
    'pendingAccSyncItemPolling',
    async (now: Date, { logger }) => {
      // logger.info('Checking for pending ACC Sync items')
      for await (const items of queryAllPendingAccSyncItemsFactory({ db })()) {
        for (const syncItem of items) {
          const projectDb = await getProjectDbClient({ projectId: syncItem.projectId })

          const manifest = await getManifestByUrn(syncItem.accFileVersionUrn)

          const isReady = isReadyForImport(manifest)

          logger.info(
            {
              syncItem,
              manifest
            },
            `ACC sync item {syncItem.id} is ${isReady ? '' : 'not'} ready`
          )

          if (!isReady) continue

          await upsertAccSyncItemFactory({ db: projectDb })({
            ...syncItem,
            status: 'SYNCING'
          })

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
    },
    5 * TIME_MS.minute
  )
}

const { FF_ACC_INTEGRATION_ENABLED } = getFeatureFlags()

const accModule: SpeckleModule = {
  init: async ({ app, isInitial }) => {
    if (!FF_ACC_INTEGRATION_ENABLED) return

    moduleLogger.info('🖕 Init acc module')

    if (isInitial) {
      accRestApi(app)
      scheduledTask = schedulePendingAccSyncItemsPoll()
    }
  },
  shutdown: () => {
    if (!FF_ACC_INTEGRATION_ENABLED) return
    scheduledTask?.stop()
  },
  finalize: () => {}
}

export default accModule

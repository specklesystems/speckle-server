/* eslint-disable camelcase */
import { createAccOidcFlow } from '@/modules/acc/oidcHelper'
import { tryRegisterAccWebhook } from '@/modules/acc/webhook'
import { sessionMiddlewareFactory } from '@/modules/auth/middleware'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/observability/logging'
import { Express } from 'express'

import { db } from '@/db/knex'
import { queryAllPendingAccSyncItemsFactory } from '@/modules/acc/repositories/accSyncItems'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { Scopes, TIME_MS } from '@speckle/shared'
import { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { AccSyncItems } from '@/modules/acc/dbSchema'
import { AccSyncItem } from '@/modules/acc/domain/types'
import {
  getAutomationTokenFactory,
  getLatestAutomationRevisionFactory,
  InsertableAutomationRun,
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

export default function accRestApi(app: Express) {
  const sessionMiddleware = sessionMiddlewareFactory()
  app.post('/auth/acc/login', sessionMiddleware, async (req, res) => {
    const { projectId } = req.body
    req.session.projectId = projectId

    const accFlow = createAccOidcFlow()
    const { codeVerifier, codeChallenge } = accFlow.generateCodeVerifier()
    req.session.codeVerifier = codeVerifier

    const authorizeUrl = accFlow.buildAuthorizeUrl({
      clientId: '5Y2LzxsL3usaD1xAMyElBY8mcN6XKyfHfulZDV3up0jfhN5Y',
      redirectUri: `${process.env.CANONICAL_URL}/auth/acc/callback`,
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
        redirectUri: `${process.env.CANONICAL_URL}/auth/acc/callback`
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

  app.post('/acc/sync-item-created', sessionMiddleware, async (req, res) => {
    const { accHubUrn } = req.body

    if (!req.session.accTokens) {
      throw new Error('whatever')
    }
    const { access_token } = req.session.accTokens
    await tryRegisterAccWebhook({
      accessToken: access_token,
      rootProjectId: accHubUrn,
      region: 'EMEA',
      event: ''
    })
    res.status(200)
  })

  // Registered ACC webhooks are handled here
  // https://aps.autodesk.com/en/docs/webhooks/v1/reference/events/data_management_events/dm.version.added/
  app.post('/acc/webhook/callback', sessionMiddleware, async (req, res) => {
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

      for (const syncItem of affectedRows) {
        console.log(`${syncItem.accFileVersionUrn} : ${syncItem.accFileName}`)

        const projectDb = await getProjectDbClient({ projectId: syncItem.projectId })

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
              functionId: '2909d29a9d',
              id: cryptoRandomString({ length: 15 }),
              status: 'pending' as const,
              elapsed: 0,
              results: null,
              contextView: null,
              statusMessage: null,
              functionReleaseId: 'd6947185f3',
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
          // for now this is a baked in constant
          // should rely on the function definitions requesting the needed scopes
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
          automationId: syncItem.automationId,
          functionRuns: runData.functionRuns.map((r) => ({
            ...r,
            runId: cryptoRandomString({ length: 15 }),
            resultVersions: [],
            functionInputs: {
              projectId: syncItem.projectId,
              modelId: syncItem.modelId,
              autodeskUrn: btoa(syncItem.accFileVersionUrn)
                .replaceAll('/', '_')
                .replaceAll('==', ''),
              autodeskRegion: 1,
              autodeskClientId: '5Y2LzxsL3usaD1xAMyElBY8mcN6XKyfHfulZDV3up0jfhN5Y',
              autodeskClientSecret:
                'qHyGqaP4zCWLyS2lp04qBDOC1giIupPzJPmLFKGFHKZrPYYpan27zF8vlhQr1RYL'
            }
          })),
          manifests: [
            {
              triggerType: 'versionCreation'
            }
          ],
          speckleToken: projectScopedToken,
          automationToken: automationToken.automateToken
        })
      }

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
    '*/1 * * * *', // Every minute
    'pendingAccSyncItemPolling',
    async (now: Date, { logger }) => {
      logger.info('Checking for pending ACC Sync items')
      for await (const items of queryAllPendingAccSyncItemsFactory({ db })()) {
        for (const item of items) {
          console.log(`${item.id} : ${item.accFileVersionUrn}`)

          // await

          // TODO: Invoke with new trigger type
          // await triggerAutomationRun({
          //   projectId: syncItem.projectId,
          //   automationId: syncItem.automationId,
          //   functionRuns: [
          //     {
          //       id: cryptoRandomString({ length: 9 }),
          //       runId: cryptoRandomString({ length: 9 }),
          //       functionId: ADAM_FUNCTION_ID,
          //       functionReleaseId: ADAM_FUNCTION_RELEASE_ID,
          //       functionInputs: {
          //         fileUrn: ''
          //       },
          //       status: 'pending' as const,
          //       elapsed: 0,
          //       results: null,
          //       contextView: null,
          //       statusMessage: null,
          //       resultVersions: [],
          //       createdAt: new Date(),
          //       updatedAt: new Date()
          //     }
          //   ],
          //   manifests: [
          //     {
          //       triggerType: 'fileUploaded',
          //       modelId: '',
          //       fileId: ''
          //     }
          //   ],
          //   speckleToken: 'project-scoped-token',
          //   automationToken: 'automation-token'
          // })
        }
      }
    },
    30 * TIME_MS.second
  )
}

export const init: SpeckleModule['init'] = async ({ app }) => {
  moduleLogger.info('🔑 Init acc module')

  // Hoist rest
  accRestApi(app)

  scheduledTask = schedulePendingAccSyncItemsPoll()
}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  scheduledTask?.stop()
}

export const finalize: SpeckleModule['finalize'] = async () => {}

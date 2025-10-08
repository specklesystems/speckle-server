import { ImporterAutomateFunctions } from '@/modules/acc/domain/constants'
import { AccSyncItemStatuses } from '@/modules/acc/domain/acc/constants'
import type { UpdateAccSyncItemStatus } from '@/modules/acc/domain/acc/operations'
import type { AccSyncItem } from '@/modules/acc/domain/acc/types'
import {
  SyncItemAutomationTriggerError,
  SyncItemNotFoundError
} from '@/modules/acc/errors/acc'
import { DefaultAppIds } from '@/modules/auth/defaultApps'
import { triggerAutomationRun } from '@/modules/automate/clients/executionEngine'
import type {
  GetAutomation,
  GetAutomationToken,
  GetLatestAutomationRevision,
  UpsertAutomationRun
} from '@/modules/automate/domain/operations'
import type { VersionCreatedTriggerManifest } from '@/modules/automate/helpers/types'
import type { InsertableAutomationRun } from '@/modules/automate/repositories/automations'
import type { CreateAndStoreAppToken } from '@/modules/core/domain/tokens/operations'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import {
  getAutodeskIntegrationClientId,
  getAutodeskIntegrationClientSecret,
  getOdaUserId,
  getOdaUserSecret
} from '@/modules/shared/helpers/envHelper'
import { logger } from '@/observability/logging'
import { Scopes } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'

export type TriggerSyncItemAutomation = (args: { id: string }) => Promise<AccSyncItem>

export const triggerSyncItemAutomationFactory =
  (deps: {
    updateAccSyncItemStatus: UpdateAccSyncItemStatus
    getAutomation: GetAutomation
    getLatestAutomationRevision: GetLatestAutomationRevision
    upsertAutomationRun: UpsertAutomationRun
    getAutomationToken: GetAutomationToken
    createAppToken: CreateAndStoreAppToken
  }): TriggerSyncItemAutomation =>
  async ({ id }) => {
    const syncItem = await deps.updateAccSyncItemStatus({
      id,
      status: AccSyncItemStatuses.syncing
    })

    if (!syncItem) {
      throw new SyncItemNotFoundError()
    }

    const automation = await deps.getAutomation({
      automationId: syncItem.automationId
    })

    if (!automation || !automation.executionEngineAutomationId) {
      logger.error(
        { syncItem },
        'Could not find automation {syncItem.automationId} configured for sync item {syncItem.id}'
      )
      throw new SyncItemAutomationTriggerError()
    }

    const automationRevision = await deps.getLatestAutomationRevision({
      automationId: syncItem.automationId
    })

    if (!automationRevision) {
      logger.error(
        { syncItem },
        'Could not find latest revision for automation {syncItem.automationId} configured for sync item {syncItem.id}'
      )
      throw new SyncItemAutomationTriggerError()
    }

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
          functionId: ImporterAutomateFunctions.rvt.functionId,
          functionReleaseId: ImporterAutomateFunctions.rvt.functionReleaseId,
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

    await deps.upsertAutomationRun(runData)

    const projectScopedToken = await deps.createAppToken({
      appId: DefaultAppIds.Automate,
      name: `acctoken-${syncItem.id}`,
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

    const automationToken = await deps.getAutomationToken(syncItem.automationId)

    if (!automationToken) {
      logger.error(
        { syncItem },
        'Could not find automate token for automation {syncItem.automationId} configured for sync item {syncItem.id}'
      )
      throw new SyncItemAutomationTriggerError()
    }

    await triggerAutomationRun({
      projectId: syncItem.projectId,
      automationId: automation.executionEngineAutomationId,
      functionRuns: runData.functionRuns.map((r) => ({
        ...r,
        runId: cryptoRandomString({ length: 15 }),
        resultVersions: [],
        functionInputs: {
          syncItemId: syncItem.id,
          projectId: syncItem.projectId,
          modelId: syncItem.modelId,
          versionUrn: syncItem.accFileVersionUrn,
          viewName: syncItem.accFileViewName ?? null,
          autodeskProjectId: syncItem.accProjectId.replace('b.', ''),
          autodeskRegion: syncItem.accRegion === 'EMEA' ? 1 : 0,
          autodeskClientId: getAutodeskIntegrationClientId(),
          autodeskClientSecret: getAutodeskIntegrationClientSecret(),
          odaUserId: getOdaUserId(),
          odaUserSignature: getOdaUserSecret()
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

    return syncItem
  }

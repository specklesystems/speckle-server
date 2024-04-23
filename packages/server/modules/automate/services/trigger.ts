import {
  InsertableAutomationRun,
  getActiveTriggerDefinitions,
  getAutomationRevision,
  getAutomationToken,
  upsertAutomationRun
} from '@/modules/automate/repositories'
import {
  AutomationWithRevision,
  AutomationTriggerDefinitionRecord,
  AutomationFunctionRunRecord,
  AutomationRevisionWithTriggersFunctions,
  VersionCreatedTriggerManifest,
  VersionCreationTriggerType,
  BaseTriggerManifest,
  isVersionCreatedTriggerManifest
} from '@/modules/automate/helpers/types'
import { getBranchLatestCommits } from '@/modules/core/repositories/branches'
import { getCommit } from '@/modules/core/repositories/commits'
import { createAppToken } from '@/modules/core/services/tokens'
import { speckleAutomateUrl } from '@/modules/shared/helpers/envHelper'
import { Scopes } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { DefaultAppIds } from '@/modules/auth/defaultApps'
import { Merge } from 'type-fest'

// TODO: Extract dependency types so that they're not duplicated
// TODO: Move to deps object to allow for different param order

/**
 * This should hook into the model version create event
 */
export const onModelVersionCreate =
  (deps: {
    getTriggers: typeof getActiveTriggerDefinitions
    triggerFunction: ReturnType<typeof triggerAutomationRevisionRun>
  }) =>
  async (params: { modelId: string; versionId: string }) => {
    const { modelId, versionId } = params
    const { getTriggers, triggerFunction } = deps

    // get triggers where modelId matches
    const triggerDefinitions = await getTriggers({
      triggeringId: modelId,
      triggerType: VersionCreationTriggerType
    })

    // get revisions where it matches any of the triggers and the revision is published
    await Promise.all(
      triggerDefinitions.map(async (tr) => {
        try {
          await triggerFunction<VersionCreatedTriggerManifest>({
            revisionId: tr.automationRevisionId,
            manifest: {
              versionId,
              modelId: tr.triggeringId,
              triggerType: tr.triggerType
            }
          })
        } catch (error) {
          console.log(error)
          //log the error
          //but also this error should be persisted for automation status display somehow
        }
      })
    )
  }

/**
 * This triggers a run for a specific automation revision
 */
export const triggerAutomationRevisionRun =
  (deps: { automateRunTrigger: typeof sendRunTriggerToAutomate }) =>
  async <M extends BaseTriggerManifest = BaseTriggerManifest>(params: {
    revisionId: string
    manifest: M
  }): Promise<{ automationRunId: string }> => {
    const { automateRunTrigger } = deps
    const { revisionId, manifest } = params

    if (!isVersionCreatedTriggerManifest(manifest)) {
      throw new Error('Only model version triggers are currently supported')
    }

    const { automationWithRevision, userId, automateToken } = await ensureRunConditions(
      {
        revisionGetter: getAutomationRevision,
        versionGetter: getCommit,
        automationTokenGetter: getAutomationToken
      }
    )({
      revisionId,
      manifest
    })

    const triggerManifests = await composeTriggerData({
      manifest,
      projectId: automationWithRevision.projectId,
      triggerDefinitions: automationWithRevision.revision.triggers
    })

    const projectScopedToken = await createAppToken({
      appId: DefaultAppIds.Automate,
      name: `at-${automationWithRevision.id}@${manifest.versionId}`,
      userId,
      // for now this is a baked in constant
      // should rely on the function definitions requesting the needed scopes
      scopes: [
        Scopes.Profile.Read,
        Scopes.Streams.Read,
        Scopes.Streams.Write,
        Scopes.Automate.ReportResults
      ]
    })

    const automationRun = createAutomationRunData({
      manifests: triggerManifests,
      automationWithRevision
    })
    await upsertAutomationRun(automationRun)

    try {
      const { automationRunId } = await automateRunTrigger({
        projectId: automationWithRevision.projectId,
        automationId: automationWithRevision.executionEngineAutomationId,
        manifests: triggerManifests,
        functionRuns: automationRun.functionRuns,
        speckleToken: projectScopedToken,
        automationToken: automateToken
      })

      automationRun.executionEngineRunId = automationRunId
      await upsertAutomationRun(automationRun)
    } catch (error) {
      const statusMessage = error instanceof Error ? error.message : `${error}`
      automationRun.status = 'error'
      automationRun.functionRuns = automationRun.functionRuns.map((fr) => ({
        ...fr,
        status: 'error',
        statusMessage
      }))
      await upsertAutomationRun(automationRun)
    }
    return { automationRunId: automationRun.id }
  }

export const ensureRunConditions =
  (deps: {
    revisionGetter: typeof getAutomationRevision
    versionGetter: typeof getCommit
    automationTokenGetter: typeof getAutomationToken
  }) =>
  async <M extends BaseTriggerManifest = BaseTriggerManifest>(params: {
    revisionId: string
    manifest: M
  }): Promise<{
    automationWithRevision: AutomationWithRevision<AutomationRevisionWithTriggersFunctions>
    userId: string
    automateToken: string
    automateRefreshToken: string
  }> => {
    const { revisionGetter, versionGetter, automationTokenGetter } = deps
    const { revisionId, manifest } = params
    const automationWithRevision = await revisionGetter(revisionId)
    if (!automationWithRevision)
      throw new Error("Cannot trigger the given revision, it doesn't exist")

    // if the automation is not active, do not trigger
    if (!automationWithRevision.enabled)
      throw new Error('The automation is not enabled, cannot trigger it')

    if (!automationWithRevision.revision.active)
      throw new Error('The automation revision is not active, cannot trigger it')

    if (!isVersionCreatedTriggerManifest(manifest))
      throw new Error('Only model version triggers are supported')

    const triggerDefinition = automationWithRevision.revision.triggers.find((t) => {
      if (t.triggerType !== manifest.triggerType) return false

      if (isVersionCreatedTriggerManifest(manifest)) {
        return t.triggeringId === manifest.modelId
      }

      return false
    })

    if (!triggerDefinition)
      throw new Error(
        "The given revision doesn't have a trigger registered matching the input trigger"
      )

    const triggeringVersion = await versionGetter(manifest.versionId)
    if (!triggeringVersion) throw new Error('The triggering version is not found')

    const userId = triggeringVersion.author
    if (!userId)
      throw new Error(
        "The user, that created the triggering version doesn't exist any more"
      )

    const token = await automationTokenGetter(automationWithRevision.id)
    if (!token) throw new Error('Cannot find a token for the automation')

    return {
      automationWithRevision,
      userId,
      automateToken: token.automateToken,
      automateRefreshToken: token.automateRefreshToken
    }
  }

async function composeTriggerData(params: {
  projectId: string
  manifest: BaseTriggerManifest
  triggerDefinitions: AutomationTriggerDefinitionRecord[]
}): Promise<BaseTriggerManifest[]> {
  const { projectId, manifest, triggerDefinitions } = params

  const manifests: BaseTriggerManifest[] = [{ ...manifest }]

  if (triggerDefinitions.length > 1) {
    const associatedTriggers = triggerDefinitions.filter((t) => {
      if (t.triggerType !== manifest.triggerType) return false

      if (isVersionCreatedTriggerManifest(manifest)) {
        return t.triggeringId === manifest.modelId
      }

      return false
    })

    // Version creation triggers
    if (manifest.triggerType === VersionCreationTriggerType) {
      const latestVersions = await getBranchLatestCommits(
        associatedTriggers.map((t) => t.triggeringId),
        projectId
      )
      manifests.push(
        ...latestVersions.map(
          (version): VersionCreatedTriggerManifest => ({
            modelId: version.branchId,
            versionId: version.id,
            triggerType: VersionCreationTriggerType
          })
        )
      )
    }
  }

  return manifests
}

type InsertableAutomationRunWithExtendedFunctionRuns = Merge<
  InsertableAutomationRun,
  {
    functionRuns: TriggeredAutomationFunctionRun[]
  }
>

function createAutomationRunData(params: {
  manifests: BaseTriggerManifest[]
  automationWithRevision: AutomationWithRevision<AutomationRevisionWithTriggersFunctions>
}): InsertableAutomationRunWithExtendedFunctionRuns {
  const { manifests, automationWithRevision } = params
  const runId = cryptoRandomString({ length: 15 })
  const versionCreatedManifests = manifests.filter(isVersionCreatedTriggerManifest)
  if (!versionCreatedManifests.length) {
    throw new Error('Only version creation triggers currently supported')
  }

  const automationRun: InsertableAutomationRunWithExtendedFunctionRuns = {
    id: runId,
    triggers: [
      ...versionCreatedManifests.map((m) => ({
        triggeringId: m.versionId,
        triggerType: m.triggerType
      }))
    ],
    executionEngineRunId: null,
    status: 'pending' as const,
    automationRevisionId: automationWithRevision.revision.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    functionRuns: automationWithRevision.revision.functions.map((f) => ({
      functionId: f.functionId,
      runId,
      id: cryptoRandomString({ length: 15 }),
      status: 'pending' as const,
      elapsed: 0,
      results: null,
      contextView: null,
      statusMessage: null,
      resultVersions: [],
      functionReleaseId: f.functionReleaseId,
      functionInputs: f.functionInputs
    }))
  }
  return automationRun
}

export type TriggeredAutomationFunctionRun = AutomationFunctionRunRecord & {
  resultVersions: string[]
  functionInputs: Record<string, unknown> | null
}

export type AutomateRunTriggerArgs = {
  projectId: string
  automationId: string
  functionRuns: TriggeredAutomationFunctionRun[]
  manifests: BaseTriggerManifest[]
  speckleToken: string
  automationToken: string
}

export async function sendRunTriggerToAutomate({
  projectId,
  functionRuns,
  manifests,
  automationId,
  speckleToken,
  automationToken
}: AutomateRunTriggerArgs): Promise<AutomationRunResponseBody> {
  const automateUrl = speckleAutomateUrl()
  if (!automateUrl)
    throw new Error('Cannot trigger automation run, Automate URL is not configured')
  const url = `${automateUrl}/api/v2/automations/${automationId}/runs`

  const functionDefinitions = functionRuns.map((functionRun) => {
    return {
      functionId: functionRun.functionId,
      functionReleaseId: functionRun.functionReleaseId,
      functionInputs: functionRun.functionInputs,
      functionRunId: functionRun.runId
    }
  })

  const versionCreationManifests = manifests.filter(isVersionCreatedTriggerManifest)
  if (!versionCreationManifests.length) {
    throw new Error('Only version creation triggers currently supported')
  }

  const payload: AutomationRunPostBody = {
    projectId,
    functionDefinitions,
    triggers: versionCreationManifests.map((t) => ({
      triggerType: t.triggerType,
      payload: { modelId: t.modelId, versionId: t.versionId }
    })),
    speckleToken
  }
  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${automationToken}`
    },
    body: JSON.stringify(payload)
  })
  const result = (await response.json()) as AutomationRunResponseBody
  //TODO handle 401
  return result
}

type AutomationRunPostBody = {
  projectId: string
  speckleToken: string
  triggers: Array<{
    payload: { modelId: string; versionId: string }
    triggerType: typeof VersionCreationTriggerType
  }>
  functionDefinitions: {
    functionInputs: Record<string, unknown> | null
    functionId: string
    functionReleaseId: string
    functionRunId: string
  }[]
}

type AutomationRunResponseBody = {
  automationRunId: string
}

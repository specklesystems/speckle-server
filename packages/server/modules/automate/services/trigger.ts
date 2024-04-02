import {
  getAutomationRevision,
  upsertAutomationRun
} from '@/modules/automate/repositories'
import {
  AutomationRun,
  AutomationRunTrigger,
  AutomationTrigger,
  AutomationTriggerModelVersion,
  AutomationWithRevision,
  AutomationRevisionTrigger
} from '@/modules/automate/types'
import { CommitRecord } from '@/modules/core/helpers/types'
import { getBranchLatestCommits } from '@/modules/core/repositories/branches'
import { getCommit } from '@/modules/core/repositories/commits'
import { createAppToken } from '@/modules/core/services/tokens'
import { speckleAutomateUrl } from '@/modules/shared/helpers/envHelper'
import { Optional, Scopes } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'

/**This should hook into the model version create event */
export const onModelVersionCreate =
  (
    triggerQuery: (args: {
      triggeringId: string
      triggerType: 'versionCreation'
    }) => Promise<AutomationRevisionTrigger[]>,
    triggerFunction: (args: {
      revisionId: string
      trigger: AutomationTriggerModelVersion
    }) => Promise<void>
  ) =>
  async ({ modelId, versionId }: { modelId: string; versionId: string }) => {
    const triggers = await triggerQuery({
      triggeringId: modelId,
      triggerType: 'versionCreation'
    })

    // get triggers where modelId matches
    // get revisions where it matches any of the triggers and the revision is published
    await Promise.all(
      triggers.map(async (tr) => {
        console.log('in trigger loop', tr)
        try {
          await triggerFunction({
            revisionId: tr.automationRevisionId,
            trigger: {
              versionId,
              triggeringId: tr.triggeringId,
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

/**This triggers a run for a specific automation revision */
export const triggerAutomationRevisionRun =
  (
    automateRunTrigger: (
      args: AutomateRunTriggerArgs
    ) => Promise<AutomationRunResponseBody>
  ) =>
  async ({
    revisionId,
    trigger
  }: {
    revisionId: string
    trigger: AutomationTriggerModelVersion
  }) => {
    const { automationWithRevision, userId } = await ensureRunConditions(
      getAutomationRevision,
      getCommit
    )({
      revisionId,
      trigger
    })

    const triggers = await composeTriggerData({
      trigger,
      projectId: automationWithRevision.projectId,
      automationTriggers: automationWithRevision.triggers
    })

    const projectScopedToken = await createAppToken({
      appId: 'spklautoma',
      name: `at-${automationWithRevision.automationId}@${trigger.versionId}`,
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

    const automationRun = createAutomationRunData({ triggers, automationWithRevision })
    await upsertAutomationRun(automationRun)

    try {
      const { automationRunId } = await automateRunTrigger({
        projectId: automationWithRevision.projectId,
        automationId: automationWithRevision.automationId,
        automationRun,
        speckleToken: projectScopedToken
      })

      automationRun.executionEngineRunId = automationRunId
      await upsertAutomationRun(automationRun)
    } catch (error) {
      automationRun.status = 'error'
      await upsertAutomationRun(automationRun)
    }
  }

export const ensureRunConditions =
  (
    revisionGetter: (revisionId: string) => Promise<AutomationWithRevision | null>,
    versionGetter: (versionId: string) => Promise<Optional<CommitRecord>>
  ) =>
  async ({
    revisionId,
    trigger
  }: {
    revisionId: string
    trigger: AutomationTriggerModelVersion
  }): Promise<{ automationWithRevision: AutomationWithRevision; userId: string }> => {
    const automationWithRevision = await revisionGetter(revisionId)
    if (!automationWithRevision)
      throw new Error("Cannot trigger the given revision, it doesn't exist")

    // if the revision is not active, do not trigger
    if (!automationWithRevision.enabled)
      throw new Error('The automation is not enabled, cannot trigger it')

    if (!automationWithRevision.active)
      throw new Error('The automation revision is not active, cannot trigger it')
    const revisionTrigger = automationWithRevision.triggers.find(
      (t) =>
        t.triggeringId === trigger.triggeringId && t.triggerType === trigger.triggerType
    )
    if (!revisionTrigger)
      throw new Error(
        "The given revision doesn't have a trigger registered matching the input trigger"
      )
    if (revisionTrigger.triggerType !== 'versionCreation')
      throw new Error('Only model version triggers are supported')

    const triggeringVersion = await versionGetter(trigger.versionId)
    if (!triggeringVersion) throw new Error('The triggering version is not found')

    const userId = triggeringVersion.author
    if (!userId)
      throw new Error(
        "The user, that created the triggering version doesn't exist any more"
      )

    return { automationWithRevision, userId }
  }

async function composeTriggerData({
  projectId,
  trigger,
  automationTriggers
}: {
  projectId: string
  trigger: AutomationTriggerModelVersion
  automationTriggers: AutomationTrigger[]
}): Promise<AutomationRunTrigger[]> {
  const triggers = [
    {
      modelId: trigger.triggeringId,
      versionId: trigger.versionId,
      triggerType: 'versionCreation' as const
    }
  ]

  if (automationTriggers.length > 1) {
    const associatedTriggers = automationTriggers.filter(
      (t) => t.triggeringId !== trigger.triggeringId
    )

    const latestVersions = await getBranchLatestCommits(
      associatedTriggers.map((t) => t.triggeringId),
      projectId
    )
    triggers.push(
      ...latestVersions.map((version) => ({
        modelId: version.branchId,
        versionId: version.id,
        triggerType: 'versionCreation' as const
      }))
    )
  }
  return triggers
}

function createAutomationRunData({
  triggers,
  automationWithRevision
}: {
  triggers: AutomationRunTrigger[]
  automationWithRevision: AutomationWithRevision
}): AutomationRun {
  const runId = cryptoRandomString({ length: 15 })
  const automationRun = {
    id: runId,
    triggers,
    executionEngineRunId: null,
    status: 'pending' as const,
    automationRevisionId: automationWithRevision.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    functionRuns: automationWithRevision.functions.map((f) => ({
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

type AutomateRunTriggerArgs = {
  projectId: string
  automationId: string
  automationRun: AutomationRun
  speckleToken: string
}

export async function sendRunTriggerToAutomate({
  projectId,
  automationRun,
  automationId,
  speckleToken
}: AutomateRunTriggerArgs): Promise<AutomationRunResponseBody> {
  const automateUrl = speckleAutomateUrl()
  if (!automateUrl)
    throw new Error('Cannot trigger automation run, Automate URL is not configured')
  const url = `${automateUrl}/api/v2/automations/${automationId}/runs`

  const functionDefinitions = automationRun.functionRuns.map((functionRun) => {
    return {
      functionId: functionRun.functionId,
      functionReleaseId: functionRun.functionReleaseId,
      functionInputs: functionRun.functionInputs,
      functionRunId: functionRun.runId
    }
  })

  const payload: AutomationRunPostBody = {
    projectId,
    functionDefinitions,
    triggers: automationRun.triggers,
    speckleToken
  }
  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  const result = (await response.json()) as AutomationRunResponseBody
  return result
}

type AutomationRunPostBody = {
  projectId: string
  speckleToken: string
  triggers: { modelId: string; versionId: string; triggerType: 'versionCreation' }[]
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

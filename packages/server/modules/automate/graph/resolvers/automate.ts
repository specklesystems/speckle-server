import {
  getAutomationByRunId,
  getLatestAutomationRunsForVersion,
  mergeRunStatus
} from '@/modules/automate/services/automationRuns'
import { AutomationRunStatus } from '@/modules/automate/types'
import {
  Resolvers,
  AutomateRunTriggerType,
  AutomateRunStatus,
  AutomateRun,
  Automation
} from '@/modules/core/graph/generated/graphql'
import { getBranchLatestCommits } from '@/modules/core/repositories/branches'

const statusMapping: Record<AutomationRunStatus, AutomateRunStatus> = {
  pending: AutomateRunStatus.Error,
  initializing: AutomateRunStatus.Initializing,
  running: AutomateRunStatus.Running,
  success: AutomateRunStatus.Succeeded,
  failure: AutomateRunStatus.Failed,
  error: AutomateRunStatus.Error
}

const getVersionAutomationStatus = async (versionId: string) => {
  const latestRunsPerAutomation = await getLatestAutomationRunsForVersion(versionId)

  const status =
    statusMapping[
      mergeRunStatus(
        latestRunsPerAutomation.flatMap((r) => r.functionRuns.map((r) => r.status))
      )
    ]

  // TODO: this resolver needs a graph type override
  // the run's automation has to be an async sub resolver
  const automationRuns: AutomateRun[] = latestRunsPerAutomation.map((r) => ({
    ...r,
    status: statusMapping[r.status],
    functionRuns: r.functionRuns.map((fr) => ({
      ...fr,
      status: statusMapping[fr.status]
    }))
  }))

  return {
    status,
    automationRuns
  }
}

export = {
  Model: {
    automationsStatus: async (parent) => {
      // no authz needed, if you can read the model, you can read its automation status
      const modelId = parent.id
      const [latestVersion] = await getBranchLatestCommits([modelId])

      return await getVersionAutomationStatus(latestVersion.id)
    }
  },
  Version: {
    automationsStatus: async (parent) => {
      return await getVersionAutomationStatus(parent.id)
    }
  },
  AutomateRun: {
    automation: async (parent) => {
      const automation = await getAutomationByRunId(parent.id)
      if (!automation) throw new Error("The automation doesn't exist any more")

      // TODO: graph type override
      return automation as unknown as Automation
    }
  },
  AutomationRevisionTriggerDefinition: {
    __resolveType(parent) {
      if (parent.type === AutomateRunTriggerType.VersionCreated) {
        return 'VersionCreatedTriggerDefinition'
      }
      return null
    }
  },
  AutomationRunTrigger: {
    __resolveType(parent) {
      if (parent.type === AutomateRunTriggerType.VersionCreated) {
        return 'VersionCreatedTrigger'
      }
      return null
    }
  }
} as Resolvers

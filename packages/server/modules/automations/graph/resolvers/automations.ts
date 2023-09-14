import {
  createModelAutomation,
  getAutomationsStatus,
  upsertModelAutomationRunResult
} from '@/modules/automations/services/management'
import { formatResults } from '@/modules/automations/services/results'
import { Resolvers } from '@/modules/core/graph/generated/graphql'

export = {
  Model: {
    async automationStatus(parent, _, ctx) {
      const modelId = parent.id
      const projectId = parent.streamId
      const latestCommit = await ctx.loaders.branches.getLatestCommit.load(parent.id)

      // if the model has no versions, no automations could have run
      if (!latestCommit) return null

      return await getAutomationsStatus({
        projectId,
        modelId,
        versionId: latestCommit.id
      })
    }
  },
  Version: {
    async automationStatus(parent, _, ctx) {
      const versionId = parent.id
      const branch = await ctx.loaders.commits.getCommitBranch.load(versionId)
      if (!branch) throw Error('Invalid version Id')

      const projectId = branch.streamId
      const modelId = branch.id
      return await getAutomationsStatus({
        projectId,
        modelId,
        versionId
      })
    }
  },
  AutomationFunctionRun: {
    async resultVersions(parent, _, ctx) {
      return ctx.loaders.automationFunctionRuns.getResultVersions.load([
        parent.automationRunId,
        parent.functionId
      ])
    },
    async results(parent) {
      const originalResults = parent.results
      if (!originalResults) return null
      return formatResults(originalResults)
    },
    id(parent) {
      return `${parent.automationRunId}-${parent.functionId}`
    }
  },
  Mutation: {
    automationMutations: () => ({})
  },
  AutomationMutations: {
    async create(_, args, context) {
      await createModelAutomation(args.input, context.userId)
      return true
    },
    async functionRunStatusReport(_, args, context) {
      const { userId } = context
      await upsertModelAutomationRunResult({ userId, input: args.input })
      return true
    }
  }
} as Resolvers

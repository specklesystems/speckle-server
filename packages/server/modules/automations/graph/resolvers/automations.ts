import {
  createModelAutomation,
  getAutomationsStatus,
  upsertModelAutomationRunResult
} from '@/modules/automations/services/automations'
import { Resolvers } from '@/modules/core/graph/generated/graphql'

export = {
  Model: {
    async automationStatus(parent, _, ctx) {
      // we're using the branch model name still?
      const modelId = parent.name
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
      if (!branch) throw Error('Very bad version Id')
      const projectId = branch.streamId
      // yes, the name, cause of webhooks.
      const modelId = branch.name
      return await getAutomationsStatus({
        projectId,
        modelId,
        versionId
      })
    }
  },
  // ModelAutomationRun: {
  //   async automation() {
  //     return {
  //       foo: 'bar'
  //     }
  //   }
  // },
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

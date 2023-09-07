import {
  createModelAutomation,
  getAutomationStatusFor,
  getAutomationsStatus,
  upsertModelAutomationRunResult
} from '@/modules/automations/services/automations'
import { Resolvers } from '@/modules/core/graph/generated/graphql'

export = {
  Model: {
    async automationStatus(parent) {
      // return await getLatestAutomationRunsFor({ modelId: parent.id })
      // how do i get the model id?
      const modelId = parent.id
      return await getAutomationsStatus({ modelId })
    }
  },
  Version: {
    async automationStatus(parent) {
      // how do i get the model id?
      const modelId = parent.parents?.at(0) || ''
      return await getAutomationStatusFor({
        modelId,
        versionId: parent.id
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

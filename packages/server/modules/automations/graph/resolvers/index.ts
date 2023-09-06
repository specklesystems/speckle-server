import {
  getAutomationStatusFor,
  storeModelAutomationRunResult
} from '@/modules/automations/services/automations'
import { Resolvers } from '@/modules/core/graph/generated/graphql'

export = {
  Model: {
    async automationStatus(parent) {
      return await getAutomationStatusFor({ modelId: parent.id })
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
  ModelAutomationRun: {
    async automation() {
      return {
        foo: 'bar'
      }
    }
  },
  Mutation: {
    automationMutations: () => ({})
  },
  AutomationMutations: {
    async create() {
      // take the automation input, and store it. Link it to the user, who created it.
      // That user should be the only one allowed to push in results
      return false
    },
    async functionRunStatusReport(parent, args, context) {
      const { userId } = context
      await storeModelAutomationRunResult({ userId, input: args.input })
      return 'foobar'
    }
  }
} as Resolvers

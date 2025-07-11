import { convertFunctionToGraphQLReturn } from '@/modules/automate/services/functionManagement'
import { defineModuleLoaders } from '@/modules/loaders'

export default defineModuleLoaders(async () => {
  return {
    getAutomateFunction: async ({ functionId }, { dataLoaders }) => {
      const automateFunction = await dataLoaders.automationsApi.getFunction.load(
        functionId
      )
      return automateFunction ? convertFunctionToGraphQLReturn(automateFunction) : null
    }
  }
})

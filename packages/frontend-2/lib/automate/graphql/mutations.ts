import { graphql } from '~/lib/common/generated/gql'

export const createAutomateFunctionMutation = graphql(`
  mutation CreateAutomateFunction($input: CreateAutomateFunctionInput!) {
    automateMutations {
      createFunction(input: $input) {
        id
        ...AutomationsFunctionsCard_AutomateFunction
        ...AutomateFunctionCreateDialogDoneStep_AutomateFunction
      }
    }
  }
`)

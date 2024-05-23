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

export const updateAutomateFunctionMutation = graphql(`
  mutation UpdateAutomateFunction($input: UpdateAutomateFunctionInput!) {
    automateMutations {
      updateFunction(input: $input) {
        id
        ...AutomateFunctionPage_AutomateFunction
      }
    }
  }
`)

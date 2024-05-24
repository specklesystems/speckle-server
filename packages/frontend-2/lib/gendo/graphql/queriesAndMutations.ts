import { graphql } from '~~/lib/common/generated/gql'

export const requestGendoAIRender = graphql(`
  mutation requestGendoAIRender($input: GendoAIRenderInput!) {
    versionMutations {
      requestGendoAIRender(input: $input)
    }
  }
`)

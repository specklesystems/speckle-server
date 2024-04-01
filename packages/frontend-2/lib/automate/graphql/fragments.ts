import { graphql } from '~/lib/common/generated/gql'

export const searchAutomateFunctionReleaseItemFragment = graphql(`
  fragment SearchAutomateFunctionReleaseItem on AutomateFunctionRelease {
    id
    versionTag
    createdAt
    inputSchema
  }
`)

import { graphql } from '~/lib/common/generated/gql'

export const intercomActiveWorkspaceQuery = graphql(`
  query IntercomActiveWorkspace($slug: String!) {
    workspaceBySlug(slug: $slug) {
      id
      name
      plan {
        name
        status
      }
      subscription {
        createdAt
        updatedAt
        currentBillingCycleEnd
      }
      team {
        totalCount
      }
    }
  }
`)

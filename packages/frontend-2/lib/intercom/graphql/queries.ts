import { graphql } from '~/lib/common/generated/gql'

export const intercomActiveWorkspaceQuery = graphql(`
  query IntercomActiveWorkspace($slug: String!) {
    workspaceBySlug(slug: $slug) {
      id
      plan {
        name
        status
      }
    }
  }
`)

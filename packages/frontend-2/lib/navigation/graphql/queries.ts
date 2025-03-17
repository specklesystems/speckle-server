import { graphql } from '~/lib/common/generated/gql'

export const headerWorkspaceSwitcherQuery = graphql(`
  query HeaderWorkspaceSwitcher($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...HeaderWorkspaceSwitcher_Workspace
    }
  }
`)

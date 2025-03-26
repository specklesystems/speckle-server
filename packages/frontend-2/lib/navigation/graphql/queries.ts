import { graphql } from '~/lib/common/generated/gql'

export const navigationActiveWorkspaceQuery = graphql(`
  query NavigationActiveWorkspace($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...UseNavigationActiveWorkspace_Workspace
    }
  }
`)

export const navigationWorkspaceListQuery = graphql(`
  query NavigationWorkspaceList {
    activeUser {
      id
      ...UseNavigationWorkspaceList_User
    }
  }
`)

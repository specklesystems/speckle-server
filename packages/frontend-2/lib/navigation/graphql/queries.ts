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

export const workspaceSearchQuery = graphql(`
  query WorkspaceSearch($workspaceSlug: String!, $query: String!) {
    workspaceBySlug(slug: $workspaceSlug) {
      search(query: $query) {
        name
        value
        category
        workspaceId
        projectId
        modelId
        versionId
        objectId
      }
    }
  }
`)

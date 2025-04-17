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

export const navigationProjectInvitesQuery = graphql(`
  query NavigationProjectInvites {
    activeUser {
      id
      projectInvites {
        ...HeaderNavNotificationsProjectInvite_PendingStreamCollaborator
      }
    }
  }
`)

export const navigationWorkspaceInvitesQuery = graphql(`
  query NavigationWorkspaceInvites {
    activeUser {
      id
      workspaceInvites {
        ...HeaderNavNotificationsWorkspaceInvite_PendingWorkspaceCollaborator
      }
    }
  }
`)

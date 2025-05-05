import { graphql } from '~/lib/common/generated/gql'

export const navigationActiveWorkspaceQuery = graphql(`
  query NavigationActiveWorkspace($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...HeaderWorkspaceSwitcherHeaderWorkspace_Workspace
      ...InviteDialogWorkspace_Workspace
      id
      name
      logo
    }
  }
`)

export const navigationWorkspaceListQuery = graphql(`
  query NavigationWorkspaceList($filter: UserProjectsFilter) {
    activeUser {
      id
      expiredSsoSessions {
        id
        ...HeaderWorkspaceSwitcherHeaderExpiredSso_LimitedWorkspace
      }
      workspaces {
        items {
          id
          ...HeaderWorkspaceSwitcherWorkspaceListItem_Workspace
        }
      }
      projects(filter: $filter) {
        totalCount
      }
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

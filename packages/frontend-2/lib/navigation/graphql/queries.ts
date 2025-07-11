import { graphql } from '~/lib/common/generated/gql'

export const navigationWorkspaceSwitcherQuery = graphql(`
  query NavigationWorkspaceSwitcher($filter: WorkspaceJoinRequestFilter) {
    activeUser {
      activeWorkspace {
        ...NavigationActiveWorkspace_Workspace
      }
      expiredSsoSessions {
        id
        ...HeaderWorkspaceSwitcherHeaderExpiredSso_LimitedWorkspace
      }
      discoverableWorkspaces {
        id
      }
      workspaceJoinRequests(filter: $filter) {
        totalCount
      }
    }
  }
`)

export const navigationWorkspaceListQuery = graphql(`
  query NavigationWorkspaceList(
    $workspaceFilter: UserWorkspacesFilter
    $projectFilter: UserProjectsFilter
  ) {
    activeUser {
      id
      workspaces(filter: $workspaceFilter) {
        items {
          id
          ...HeaderWorkspaceSwitcherWorkspaceListItem_Workspace
        }
      }
      projects(filter: $projectFilter) {
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

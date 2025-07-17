import { graphql } from '~/lib/common/generated/gql'

export const navigationWorkspaceSwitcherQuery = graphql(`
  query NavigationWorkspaceSwitcher($joinRequestFilter: WorkspaceJoinRequestFilter) {
    activeUser {
      id
      ...WorkspaceSwitcherActiveWorkspace_User
    }
  }
`)

export const workspaceSwitcherHeaderWorkspaceQuery = graphql(`
  query WorkspaceSwitcherHeaderWorkspace($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...HeaderWorkspaceSwitcherHeaderWorkspace_Workspace
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

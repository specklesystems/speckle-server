import { graphql } from '~~/lib/common/generated/gql'

export const workspaceAccessCheckQuery = graphql(`
  query WorkspaceAccessCheck($id: String!) {
    workspace(id: $id) {
      id
    }
  }
`)

export const workspacePageQuery = graphql(`
  query WorkspacePageQuery(
    $workspaceId: String!
    $filter: WorkspaceProjectsFilter
    $cursor: String
    $invitesFilter: PendingWorkspaceCollaboratorsFilter
    $token: String
  ) {
    workspace(id: $workspaceId) {
      id
      ...WorkspaceHeader_Workspace
      ...WorkspaceMixpanelUpdateGroup_Workspace
      projects(filter: $filter, cursor: $cursor, limit: 10) {
        ...WorkspaceProjectList_ProjectCollection
      }
    }
    workspaceInvite(workspaceId: $workspaceId, token: $token) {
      id
      ...WorkspaceInviteBanner_PendingWorkspaceCollaborator
      ...WorkspaceInviteBlock_PendingWorkspaceCollaborator
    }
  }
`)

export const workspaceProjectsQuery = graphql(`
  query WorkspaceProjectsQuery(
    $workspaceId: String!
    $filter: WorkspaceProjectsFilter
    $cursor: String
  ) {
    workspace(id: $workspaceId) {
      id
      projects(filter: $filter, cursor: $cursor, limit: 10) {
        ...WorkspaceProjectList_ProjectCollection
      }
    }
  }
`)

export const workspaceInviteQuery = graphql(`
  query WorkspaceInvite($workspaceId: String, $token: String) {
    workspaceInvite(workspaceId: $workspaceId, token: $token) {
      ...WorkspaceInviteBanner_PendingWorkspaceCollaborator
      ...WorkspaceInviteBlock_PendingWorkspaceCollaborator
    }
  }
`)

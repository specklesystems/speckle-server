import { graphql } from '~~/lib/common/generated/gql'

export const workspaceAccessCheckQuery = graphql(`
  query WorkspaceAccessCheck($slug: String!) {
    workspaceBySlug(slug: $slug) {
      id
    }
  }
`)

export const workspacePageQuery = graphql(`
  query WorkspacePageQuery(
    $workspaceSlug: String!
    $filter: WorkspaceProjectsFilter
    $cursor: String
    $invitesFilter: PendingWorkspaceCollaboratorsFilter
    $token: String
  ) {
    workspaceBySlug(slug: $workspaceSlug) {
      id
      ...WorkspaceHeader_Workspace
      ...WorkspaceMixpanelUpdateGroup_Workspace
      projects(filter: $filter, cursor: $cursor, limit: 10) {
        ...WorkspaceProjectList_ProjectCollection
      }
    }
    workspaceInvite(
      workspaceId: $workspaceSlug
      token: $token
      options: { useSlug: true }
    ) {
      id
      ...WorkspaceInviteBanner_PendingWorkspaceCollaborator
      ...WorkspaceInviteBlock_PendingWorkspaceCollaborator
    }
  }
`)

export const workspaceProjectsQuery = graphql(`
  query WorkspaceProjectsQuery(
    $workspaceSlug: String!
    $filter: WorkspaceProjectsFilter
    $cursor: String
  ) {
    workspaceBySlug(slug: $workspaceSlug) {
      id
      projects(filter: $filter, cursor: $cursor, limit: 10) {
        ...WorkspaceProjectList_ProjectCollection
      }
    }
  }
`)

export const workspaceInviteQuery = graphql(`
  query WorkspaceInvite(
    $workspaceId: String
    $token: String
    $options: WorkspaceInviteLookupOptions
  ) {
    workspaceInvite(workspaceId: $workspaceId, token: $token, options: $options) {
      ...WorkspaceInviteBanner_PendingWorkspaceCollaborator
      ...WorkspaceInviteBlock_PendingWorkspaceCollaborator
    }
  }
`)

export const moveProjectsDialogQuery = graphql(`
  query MoveProjectsDialog {
    activeUser {
      ...MoveProjectsDialog_User
    }
  }
`)

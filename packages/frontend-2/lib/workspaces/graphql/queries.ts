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
    $invitesFilter: PendingWorkspaceCollaboratorsFilter
    $token: String
  ) {
    workspaceBySlug(slug: $workspaceSlug) {
      ...WorkspaceProjectList_Workspace
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

export const workspaceFunctionsQuery = graphql(`
  query WorkspaceFunctionsQuery($workspaceSlug: String!) {
    ...AutomateFunctionsPageHeader_Query
    workspaceBySlug(slug: $workspaceSlug) {
      id
      name
      automateFunctions {
        items {
          id
          ...AutomationsFunctionsCard_AutomateFunction
          ...AutomateAutomationCreateDialog_AutomateFunction
        }
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

export const validateWorkspaceSlugQuery = graphql(`
  query ValidateWorkspaceSlug($slug: String!) {
    validateWorkspaceSlug(slug: $slug)
  }
`)

export const workspaceSsoByEmailQuery = graphql(`
  query WorkspaceSsoByEmail($email: String!) {
    workspaceSsoByEmail(email: $email) {
      ...AuthSsoLogin_Workspace
    }
  }
`)

export const workspaceSsoCheckQuery = graphql(`
  query WorkspaceSsoCheck($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...WorkspaceSsoStatus_Workspace
    }
    activeUser {
      ...WorkspaceSsoStatus_User
    }
  }
`)

export const workspaceWizardQuery = graphql(`
  query WorkspaceWizard($workspaceId: String!) {
    workspace(id: $workspaceId) {
      id
      ...WorkspaceWizard_Workspace
    }
  }
`)

export const workspaceWizardRegionQuery = graphql(`
  query WorkspaceWizardRegion {
    serverInfo {
      ...WorkspaceWizardStepRegion_ServerInfo
    }
  }
`)

export const workspaceGetIdBySlugQuery = graphql(`
  query WorkspaceGetIdBySlug($slug: String!) {
    workspaceBySlug(slug: $slug) {
      id
    }
  }
`)

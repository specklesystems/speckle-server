import { graphql } from '~~/lib/common/generated/gql'

export const workspaceAccessCheckQuery = graphql(`
  query WorkspaceAccessCheck($slug: String!) {
    workspaceBySlug(slug: $slug) {
      id
      slug
    }
    activeUser {
      id
      activeWorkspace {
        id
        slug
      }
    }
  }
`)

export const workspacePageQuery = graphql(`
  query WorkspacePageQuery(
    $workspaceSlug: String!
    $invitesFilter: PendingWorkspaceCollaboratorsFilter
  ) {
    workspaceBySlug(slug: $workspaceSlug) {
      ...WorkspacePage_Workspace
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
        ...WorkspaceDashboardProjectList_ProjectCollection
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

export const discoverableWorkspacesQuery = graphql(`
  query DiscoverableWorkspaces {
    activeUser {
      id
      discoverableWorkspaces {
        ...DiscoverableWorkspace_LimitedWorkspace
      }
      workspaceJoinRequests {
        items {
          ...WorkspaceJoinRequests_LimitedWorkspaceJoinRequest
        }
      }
    }
  }
`)

export const workspacePlanQuery = graphql(`
  query WorkspacePlan($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...WorkspacesPlan_Workspace
    }
  }
`)

export const activeWorkspaceQuery = graphql(`
  query activeWorkspace($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...ActiveWorkspace_Workspace
    }
  }
`)

export const workspaceLastAdminCheckQuery = graphql(`
  query WorkspaceLastAdminCheck($slug: String!) {
    workspaceBySlug(slug: $slug) {
      teamByRole {
        admins {
          totalCount
        }
      }
    }
  }
`)

export const workspaceLimitsQuery = graphql(`
  query WorkspaceLimits($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...WorkspacePlanLimits_Workspace
    }
  }
`)

export const workspaceUsageQuery = graphql(`
  query WorkspaceUsage($slug: String!) {
    workspaceBySlug(slug: $slug) {
      ...WorkspaceUsage_Workspace
    }
  }
`)

export const workspaceMoveProjectManagerProjectQuery = graphql(`
  query WorkspaceMoveProjectManagerProject($projectId: String!, $workspaceId: String) {
    project(id: $projectId) {
      ...WorkspaceMoveProjectManager_Project
    }
  }
`)

export const workspaceMoveProjectManagerWorkspaceQuery = graphql(`
  query WorkspaceMoveProjectManagerWorkspace(
    $workspaceSlug: String!
    $projectId: String
  ) {
    workspaceBySlug(slug: $workspaceSlug) {
      ...WorkspaceMoveProjectManager_Workspace
    }
  }
`)

export const workspaceMoveProjectManagerUserQuery = graphql(`
  query WorkspaceMoveProjectManagerUser(
    $cursor: String
    $filter: UserProjectsFilter
    $projectId: String
    $sortBy: [String!]
    $workspaceId: String
  ) {
    activeUser {
      ...WorkspaceMoveProjectSelectWorkspace_User
    }
  }
`)

export const useCanCreateWorkspaceQuery = graphql(`
  query UseCanCreateWorkspace {
    activeUser {
      ...UseCanCreateWorkspace_User
    }
  }
`)

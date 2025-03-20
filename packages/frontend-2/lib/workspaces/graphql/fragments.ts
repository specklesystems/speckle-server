import { graphql } from '~~/lib/common/generated/gql'

// Base workspace fragment
export const workspaceBaseFragment = graphql(`
  fragment WorkspaceBase_Workspace on Workspace {
    id
    name
    slug
    role
    description
    logo
    plan {
      status
      createdAt
    }
  }
`)

export const workspaceDashboardAboutFragment = graphql(`
  fragment WorkspaceDashboardAbout_Workspace on Workspace {
    id
    name
    description
  }
`)

export const workspaceInvitedTeamFragment = graphql(`
  fragment WorkspaceInvitedTeam_Workspace on Workspace {
    id
    invitedTeam(filter: $invitesFilter) {
      id
      role
      email
    }
  }
`)

export const workspaceTeamFragment = graphql(`
  fragment WorkspaceTeam_Workspace on Workspace {
    id
    slug
    team {
      totalCount
      items {
        id
        user {
          id
          name
          ...LimitedUserAvatar
        }
      }
    }
    adminWorkspacesJoinRequests {
      totalCount
      items {
        status
        id
      }
    }
    ...WorkspaceInvitedTeam_Workspace
  }
`)

export const workspaceSecurityFragment = graphql(`
  fragment WorkspaceSecurity_Workspace on Workspace {
    id
    slug
    domains {
      id
      domain
    }
  }
`)

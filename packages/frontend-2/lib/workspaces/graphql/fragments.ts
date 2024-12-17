import { graphql } from '~~/lib/common/generated/gql'

export const workspaceBaseFragment = graphql(`
  fragment WorkspaceBase_Workspace on Workspace {
    id
    name
    slug
    role
    logo
    description
    plan {
      status
      createdAt
    }
  }
`)

export const workspaceTeamFragment = graphql(`
  fragment WorkspaceTeam_Workspace on Workspace {
    id
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
  }
`)

export const workspaceSecurityFragment = graphql(`
  fragment WorkspaceSecurity_Workspace on Workspace {
    id
    domains {
      id
      domain
    }
  }
`)

export const workspaceAboutFragment = graphql(`
  fragment WorkspaceAbout_Workspace on Workspace {
    id
    description
  }
`)

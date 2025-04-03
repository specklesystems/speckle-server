import { basicProjectFieldsFragment } from '@/test/graphql/projects'
import { gql } from 'graphql-tag'

export const basicWorkspaceFragment = gql`
  fragment BasicWorkspace on Workspace {
    id
    name
    slug
    updatedAt
    createdAt
    role
    readOnly
  }
`

export const basicPendingWorkspaceCollaboratorFragment = gql`
  fragment BasicPendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    inviteId
    workspaceId
    workspaceName
    title
    role
    invitedBy {
      id
      name
    }
    user {
      id
      name
    }
    token
  }
`

export const workspaceProjectsFragment = gql`
  fragment WorkspaceProjects on ProjectCollection {
    items {
      id
    }
    cursor
    totalCount
  }
`

export const createWorkspaceInviteQuery = gql`
  mutation CreateWorkspaceInvite(
    $workspaceId: String!
    $input: WorkspaceInviteCreateInput!
  ) {
    workspaceMutations {
      invites {
        create(workspaceId: $workspaceId, input: $input) {
          ...BasicWorkspace
          invitedTeam {
            ...BasicPendingWorkspaceCollaborator
          }
        }
      }
    }
  }

  ${basicWorkspaceFragment}
  ${basicPendingWorkspaceCollaboratorFragment}
`

export const batchCreateWorkspaceInvitesQuery = gql`
  mutation BatchCreateWorkspaceInvites(
    $workspaceId: String!
    $input: [WorkspaceInviteCreateInput!]!
  ) {
    workspaceMutations {
      invites {
        batchCreate(workspaceId: $workspaceId, input: $input) {
          ...BasicWorkspace
          invitedTeam {
            ...BasicPendingWorkspaceCollaborator
          }
        }
      }
    }
  }

  ${basicWorkspaceFragment}
  ${basicPendingWorkspaceCollaboratorFragment}
`

export const getWorkspaceWithTeamQuery = gql`
  query GetWorkspaceWithTeam($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...BasicWorkspace
      invitedTeam {
        ...BasicPendingWorkspaceCollaborator
      }
    }
  }

  ${basicWorkspaceFragment}
  ${basicPendingWorkspaceCollaboratorFragment}
`

export const getWorkspaceWithProjectsQuery = gql`
  query GetWorkspaceWithProjects($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...BasicWorkspace
      projects {
        ...WorkspaceProjects
      }
    }
  }

  ${basicWorkspaceFragment}
  ${workspaceProjectsFragment}
`

export const cancelInviteMutation = gql`
  mutation CancelWorkspaceInvite($workspaceId: String!, $inviteId: String!) {
    workspaceMutations {
      invites {
        cancel(workspaceId: $workspaceId, inviteId: $inviteId) {
          ...BasicWorkspace
          invitedTeam {
            ...BasicPendingWorkspaceCollaborator
          }
        }
      }
    }
  }

  ${basicWorkspaceFragment}
  ${basicPendingWorkspaceCollaboratorFragment}
`
export const useInviteMutation = gql`
  mutation UseWorkspaceInvite($input: WorkspaceInviteUseInput!) {
    workspaceMutations {
      invites {
        use(input: $input)
      }
    }
  }
`

export const getWorkspaceInviteQuery = gql`
  query GetWorkspaceInvite(
    $workspaceId: String!
    $token: String
    $options: WorkspaceInviteLookupOptions = null
  ) {
    workspaceInvite(workspaceId: $workspaceId, token: $token, options: $options) {
      ...BasicPendingWorkspaceCollaborator
    }
  }

  ${basicPendingWorkspaceCollaboratorFragment}
`

export const getMyWorkspaceInvitesQuery = gql`
  query GetMyWorkspaceInvites {
    activeUser {
      workspaceInvites {
        ...BasicPendingWorkspaceCollaborator
      }
    }
  }

  ${basicPendingWorkspaceCollaboratorFragment}
`

export const useWorkspaceProjectInviteMutation = gql`
  mutation UseWorkspaceProjectInvite($input: ProjectInviteUseInput!) {
    projectMutations {
      invites {
        use(input: $input)
      }
    }
  }
`

export const createWorkspaceProjectInviteMutation = gql`
  mutation CreateWorkspaceProjectInvite(
    $projectId: ID!
    $inputs: [WorkspaceProjectInviteCreateInput!]!
  ) {
    projectMutations {
      invites {
        createForWorkspace(projectId: $projectId, inputs: $inputs) {
          id
        }
      }
    }
  }
`

export const resendWorkspaceInviteMutation = gql`
  mutation ResendWorkspaceInvite($input: WorkspaceInviteResendInput!) {
    workspaceMutations {
      invites {
        resend(input: $input)
      }
    }
  }
`

export const addWorkspaceDomainMutation = gql`
  mutation AddWorkspaceDomain($input: AddDomainToWorkspaceInput!) {
    workspaceMutations {
      addDomain(input: $input) {
        id
        domains {
          id
        }
      }
    }
  }
`

export const deleteWorkspaceDomainMutation = gql`
  mutation DeleteWorkspaceDomain($input: WorkspaceDomainDeleteInput!) {
    workspaceMutations {
      deleteDomain(input: $input) {
        id
        domains {
          id
        }
        domainBasedMembershipProtectionEnabled
        discoverabilityEnabled
      }
    }
  }
`

export const getAvailableRegionsQuery = gql`
  query GetAvailableRegions {
    serverInfo {
      multiRegion {
        regions {
          id
          key
          name
        }
      }
    }
  }
`

export const getDefaultRegionQuery = gql`
  query GetWorkspaceDefaultRegion($workspaceId: String!) {
    workspace(id: $workspaceId) {
      id
      defaultRegion {
        id
        key
        name
      }
    }
  }
`

export const setDefaultRegionMutation = gql`
  mutation SetWorkspaceDefaultRegion($workspaceId: String!, $regionKey: String!) {
    workspaceMutations {
      setDefaultRegion(regionKey: $regionKey, workspaceId: $workspaceId) {
        id
        defaultRegion {
          id
          key
          name
        }
      }
    }
  }
`

export const onWorkspaceProjectsUpdatedSubscription = gql`
  subscription OnWorkspaceProjectsUpdated(
    $workspaceId: String
    $workspaceSlug: String
  ) {
    workspaceProjectsUpdated(workspaceId: $workspaceId, workspaceSlug: $workspaceSlug) {
      type
      projectId
      workspaceId
      project {
        id
        name
      }
    }
  }

  ${basicWorkspaceFragment}
`

export const onWorkspaceUpdatedSubscription = gql`
  subscription OnWorkspaceUpdated($workspaceId: String, $workspaceSlug: String) {
    workspaceUpdated(workspaceId: $workspaceId, workspaceSlug: $workspaceSlug) {
      id
      workspace {
        ...BasicWorkspace
        team {
          totalCount
          items {
            id
            role
            user {
              id
              name
            }
          }
        }
        invitedTeam {
          ...BasicPendingWorkspaceCollaborator
        }
      }
    }
  }

  ${basicWorkspaceFragment}
`

export const dismissWorkspaceMutation = gql`
  mutation dismissWorkspace($input: WorkspaceDismissInput!) {
    workspaceMutations {
      dismiss(input: $input)
    }
  }
`

export const requestToJoinWorkspaceMutation = gql`
  mutation requestToJoinWorkspace($input: WorkspaceRequestToJoinInput!) {
    workspaceMutations {
      requestToJoin(input: $input)
    }
  }
`

export const getWorkspaceWithJoinRequestsQuery = gql`
  query GetWorkspaceWithJoinRequests(
    $workspaceId: String!
    $filter: AdminWorkspaceJoinRequestFilter
    $cursor: String
    $limit: Int
  ) {
    workspace(id: $workspaceId) {
      ...BasicWorkspace
      adminWorkspacesJoinRequests(filter: $filter, cursor: $cursor, limit: $limit) {
        items {
          status
          user {
            id
            name
          }
          workspace {
            id
            name
          }
          createdAt
        }
        cursor
        totalCount
      }
    }
  }
  ${basicWorkspaceFragment}
`

export const getWorkspaceWithSubscriptionQuery = gql`
  query GetWorkspaceWithSubscription($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...BasicWorkspace
      subscription {
        createdAt
        updatedAt
        currentBillingCycleEnd
        billingInterval
        seats {
          editors {
            available
            assigned
          }
          viewers {
            assigned
          }
        }
      }
    }
  }
  ${basicWorkspaceFragment}
`

export const getWorkspaceSeatCounts = gql`
  query GetWorkspaceSeatCounts($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...BasicWorkspace
      subscription {
        seats {
          editors {
            assigned
          }
          viewers {
            assigned
          }
        }
      }
    }
  }
  ${basicWorkspaceFragment}
`

export const getWorkspacePlanUsage = gql`
  query GetWorkspacePlanUsage($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...BasicWorkspace
      plan {
        usage {
          projectCount
          modelCount
        }
      }
    }
  }
`

export const getWorkspaceWithMembersByRole = gql`
  query GetWorkspaceWithMembersByRole($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...BasicWorkspace
      teamByRole {
        admins {
          totalCount
        }
        members {
          totalCount
        }
        guests {
          totalCount
        }
      }
    }
  }
  ${basicWorkspaceFragment}
`

export const updateWorkspaceProjectRoleMutation = gql`
  mutation UpdateWorkspaceProjectRole($input: ProjectUpdateRoleInput!) {
    workspaceMutations {
      projects {
        updateRole(input: $input) {
          ...BasicProjectFields
        }
      }
    }
  }

  ${basicProjectFieldsFragment}
`

export const updateWorkspaceSeatTypeMutation = gql`
  mutation UpdateWorkspaceSeatType($input: WorkspaceUpdateSeatTypeInput!) {
    workspaceMutations {
      updateSeatType(input: $input) {
        id
        team {
          items {
            id
            role
            seatType
          }
        }
      }
    }
  }
`

export const invitableUsersInProjectQuery = gql`
  query GetProjectInvitableCollaborators($projectId: String!, $search: String) {
    project(id: $projectId) {
      id
      name
      invitableCollaborators(filter: { search: $search }) {
        totalCount
        items {
          id
          user {
            name
          }
        }
      }
    }
  }
`

import { basicWorkspaceFragment } from '@/modules/workspaces/tests/helpers/graphql'
import type { ProjectImplicitRoleCheckFragment } from '@/modules/core/graph/generated/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { Roles } from '@speckle/shared'
import { gql } from 'graphql-tag'

export const fullPermissionCheckResultFragment = gql(`
  fragment FullPermissionCheckResult on PermissionCheckResult {
    authorized
    code
    message
    payload
    errorMessage
  }
`)

export const projectImplicitRoleCheckFragment = gql`
  fragment ProjectImplicitRoleCheck on Project {
    id
    role
    permissions {
      # general access check
      canRead {
        ...FullPermissionCheckResult
      }
      # implicit reviewer check
      canReadSettings {
        ...FullPermissionCheckResult
      }
      # implicit owner check
      canReadWebhooks {
        ...FullPermissionCheckResult
      }
      # implicit contributor check
      canCreateModel {
        ...FullPermissionCheckResult
      }
    }
  }

  ${fullPermissionCheckResultFragment}
`

export const getUserWorkspaceAccessQuery = gql`
  query GetUserWorkspaceAccess($id: String!) {
    workspace(id: $id) {
      id
      role
      seatType
    }
  }
`

export const getUserWorkspaceProjectsWithAccessChecksQuery = gql`
  query GetUserWorkspaceProjectsWithAccessChecks(
    $id: String!
    $limit: Int
    $cursor: String
    $filter: WorkspaceProjectsFilter
  ) {
    workspace(id: $id) {
      ...BasicWorkspace
      role
      seatType
      projects(limit: $limit, cursor: $cursor, filter: $filter) {
        items {
          ...ProjectImplicitRoleCheck
        }
        cursor
        totalCount
      }
    }
  }

  ${basicWorkspaceFragment}
  ${projectImplicitRoleCheckFragment}
`

export const getUserProjectsWithAccessChecksQuery = gql`
  query GetUserProjectsWithAccessChecks(
    $limit: Int
    $cursor: String
    $filter: UserProjectsFilter
  ) {
    activeUser {
      id
      projects(limit: $limit, cursor: $cursor, filter: $filter) {
        items {
          ...ProjectImplicitRoleCheck
        }
        cursor
        totalCount
      }
    }
  }
  ${projectImplicitRoleCheckFragment}
`

export const projectImplicitRoleCheck = (
  project: MaybeNullOrUndefined<ProjectImplicitRoleCheckFragment>
) => {
  return {
    hasAccess: !!project?.permissions?.canRead.authorized,
    isReviewer: !!project?.permissions?.canReadSettings.authorized,
    isContributor: !!project?.permissions?.canCreateModel.authorized,
    isOwner: !!project?.permissions?.canReadWebhooks.authorized,
    isExplicitOwner: project?.role === Roles.Stream.Owner,
    isExplicitContributor: project?.role === Roles.Stream.Contributor,
    isExplicitReviewer: project?.role === Roles.Stream.Reviewer,
    hasExplicitRole: !!project?.role
  }
}

export type ProjectImplicitRoleCheck = ReturnType<typeof projectImplicitRoleCheck>

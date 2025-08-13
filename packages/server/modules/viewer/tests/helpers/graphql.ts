import gql from 'graphql-tag'

const basicSavedViewFragment = gql`
  fragment BasicSavedView on SavedView {
    id
    name
    description
    author {
      id
    }
    groupId
    group {
      id
      title
      isUngroupedViewsGroup
    }
    createdAt
    updatedAt
    resourceIdString
    resourceIds
    isHomeView
    visibility
    viewerState
    screenshot
    position
    projectId
  }
`

const basicSavedViewGroupFragment = gql`
  fragment BasicSavedViewGroup on SavedViewGroup {
    id
    projectId
    resourceIds
    title
    isUngroupedViewsGroup
    views(input: $viewsInput) {
      totalCount
      cursor
      items {
        ...BasicSavedView
      }
    }
  }
`

export const createSavedViewMutation = gql`
  mutation CreateSavedView($input: CreateSavedViewInput!) {
    projectMutations {
      savedViewMutations {
        createView(input: $input) {
          ...BasicSavedView
        }
      }
    }
  }

  ${basicSavedViewFragment}
`

export const createSavedGroupMutation = gql`
  mutation CreateSavedViewGroup(
    $input: CreateSavedViewGroupInput!
    $viewsInput: SavedViewGroupViewsInput! = { limit: 10 }
  ) {
    projectMutations {
      savedViewMutations {
        createGroup(input: $input) {
          ...BasicSavedViewGroup
        }
      }
    }
  }
`

export const getProjectSavedViewGroupsQuery = gql`
  query GetProjectSavedViewGroups(
    $projectId: String!
    $input: SavedViewGroupsInput!
    $viewsInput: SavedViewGroupViewsInput! = { limit: 10 }
  ) {
    project(id: $projectId) {
      savedViewGroups(input: $input) {
        totalCount
        cursor
        items {
          ...BasicSavedViewGroup
        }
      }
    }
  }

  ${basicSavedViewGroupFragment}
`

export const getProjectSavedViewGroupQuery = gql`
  query GetProjectSavedViewGroup(
    $projectId: String!
    $groupId: ID!
    $viewsInput: SavedViewGroupViewsInput! = { limit: 10 }
  ) {
    project(id: $projectId) {
      savedViewGroup(id: $groupId) {
        ...BasicSavedViewGroup
      }
    }
  }

  ${basicSavedViewGroupFragment}
`

export const getProjectUngroupedViewGroupQuery = gql`
  query GetProjectUngroupedViewGroup(
    $projectId: String!
    $input: GetUngroupedViewGroupInput!
    $viewsInput: SavedViewGroupViewsInput! = { limit: 10 }
  ) {
    project(id: $projectId) {
      ungroupedViewGroup(input: $input) {
        ...BasicSavedViewGroup
      }
    }
  }
`

export const getProjectSavedViewQuery = gql`
  query GetProjectSavedView($projectId: String!, $viewId: ID!) {
    project(id: $projectId) {
      savedView(id: $viewId) {
        ...BasicSavedView
      }
    }
  }
  ${basicSavedViewFragment}
`

export const deleteSavedViewMutation = gql`
  mutation DeleteSavedView($input: DeleteSavedViewInput!) {
    projectMutations {
      savedViewMutations {
        deleteView(input: $input)
      }
    }
  }
`

export const canCreateSavedViewQuery = gql`
  query CanCreateSavedView($projectId: String!) {
    project(id: $projectId) {
      id
      permissions {
        canCreateSavedView {
          authorized
          code
          message
          payload
        }
      }
    }
  }
`

export const canUpdateSavedViewQuery = gql`
  query CanUpdateSavedView($projectId: String!, $viewId: ID!) {
    project(id: $projectId) {
      id
      savedView(id: $viewId) {
        id
        permissions {
          canUpdate {
            authorized
            code
            message
            payload
          }
        }
      }
    }
  }
`

export const updateSavedViewMutation = gql`
  mutation UpdateSavedView($input: UpdateSavedViewInput!) {
    projectMutations {
      savedViewMutations {
        updateView(input: $input) {
          ...BasicSavedView
        }
      }
    }
  }

  ${basicSavedViewFragment}
`

export const deleteSavedViewGroupMutation = gql`
  mutation DeleteSavedViewGroup($input: DeleteSavedViewGroupInput!) {
    projectMutations {
      savedViewMutations {
        deleteGroup(input: $input)
      }
    }
  }
`

export const canUpdateSavedViewGroupQuery = gql`
  query CanUpdateSavedViewGroup($projectId: String!, $groupId: ID!) {
    project(id: $projectId) {
      id
      savedViewGroup(id: $groupId) {
        id
        permissions {
          canUpdate {
            authorized
            code
            message
            payload
          }
        }
      }
    }
  }
`

export const updateSavedViewGroupMutation = gql`
  mutation UpdateSavedViewGroup(
    $input: UpdateSavedViewGroupInput!
    $viewsInput: SavedViewGroupViewsInput! = { limit: 10 }
  ) {
    projectMutations {
      savedViewMutations {
        updateGroup(input: $input) {
          ...BasicSavedViewGroup
        }
      }
    }
  }

  ${basicSavedViewGroupFragment}
`

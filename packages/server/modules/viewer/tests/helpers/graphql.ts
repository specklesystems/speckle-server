import gql from 'graphql-tag'

const basicSavedViewFragment = gql`
  fragment BasicSavedView on SavedView {
    id
    name
    description
    author {
      id
    }
    groupName
    createdAt
    updatedAt
    resourceIdString
    resourceIds
    isHomeView
    visibility
    viewerState
    screenshot
    position
  }
`

const basicSavedViewGroupFragment = gql`
  fragment BasicSavedViewGroup on SavedViewGroup {
    id
    projectId
    resourceIds
    title
    isUngroupedViewsGroup
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

export const getProjectSavedViewGroupsQuery = gql`
  query GetProjectSavedViewGroups($projectId: String!, $input: SavedViewGroupsInput!) {
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

export const getProjectSavedViewGroupsWithViewsQuery = gql`
  query GetProjectSavedViewGroupsWithViews(
    $projectId: String!
    $groupId: ID!
    $viewsInput: SavedViewGroupViewsInput!
  ) {
    project(id: $projectId) {
      savedViewGroup(id: $groupId) {
        ...BasicSavedViewGroup
        views(input: $viewsInput) {
          totalCount
          cursor
          items {
            ...BasicSavedView
          }
        }
      }
    }
  }

  ${basicSavedViewGroupFragment}
`

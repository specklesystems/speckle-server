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

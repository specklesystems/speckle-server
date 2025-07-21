import gql from 'graphql-tag'

const basicSavedViewFragment = gql`
  fragment BasicSavedView on SavedView {
    id
    name
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

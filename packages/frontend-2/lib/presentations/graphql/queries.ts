import { graphql } from '~/lib/common/generated/gql'

export const usePresentationQuery = graphql(`
  query UsePresentationQuery(
    $savedViewGroupId: ID!
    $projectId: String!
    $savedViewGroupViewsInput: SavedViewGroupViewsInput!
  ) {
    project(id: $projectId) {
      id
      workspace {
        id
        ...PresentationLeftSidebar_Workspace
      }
      savedViewGroup(id: $savedViewGroupId) {
        id
        ...UsePresentation_SavedViewGroup
      }
    }
  }
`)

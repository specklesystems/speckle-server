import { graphql } from '~/lib/common/generated/gql/gql'

export const projectPresentationPageQuery = graphql(`
  query ProjectPresentationPage(
    $input: SavedViewGroupViewsInput!
    $savedViewGroupId: ID!
    $projectId: String!
  ) {
    project(id: $projectId) {
      id
      workspace {
        id
        name
        logo
      }
      savedViewGroup(id: $savedViewGroupId) {
        id
        title
        ...PresentationSlidesSidebar_SavedViewGroup
        ...PresentationViewerPageWrapper_SavedViewGroup
        views(input: $input) {
          totalCount
          items {
            id
            name
            description
            screenshot
            projectId
            visibility
            group {
              id
            }
          }
        }
      }
    }
  }
`)

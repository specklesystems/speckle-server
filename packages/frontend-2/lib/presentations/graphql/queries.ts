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
        ...PresentationLeftSidebar_Workspace
      }
      savedViewGroup(id: $savedViewGroupId) {
        id
        title
        ...PresentationViewerPageWrapper_SavedViewGroup
        ...PresentationHeader_SavedViewGroup
        ...PresentationSlideListSlide_SavedViewGroup
        views(input: $input) {
          totalCount
          items {
            id
            name
            description
            screenshot
            projectId
            visibility
            ...PresentationInfoSidebar_SavedView
            group {
              id
            }
          }
        }
      }
    }
  }
`)

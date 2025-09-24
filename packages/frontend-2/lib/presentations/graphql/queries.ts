import { graphql } from '~/lib/common/generated/gql/gql'

export const projectPresentationPageQuery = graphql(`
  query ProjectPresentationPage(
    $input: SavedViewGroupViewsInput!
    $savedViewGroupId: ID!
    $projectId: String!
  ) {
    project(id: $projectId) {
      id
      limitedWorkspace {
        id
        ...PresentationLeftSidebar_LimitedWorkspace
      }
      savedViewGroup(id: $savedViewGroupId) {
        id
        title
        ...PresentationViewerPageWrapper_SavedViewGroup
        ...PresentationHeader_SavedViewGroup
        ...PresentationSlideList_SavedViewGroup
        ...PresentationInfoSidebar_SavedViewGroup
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

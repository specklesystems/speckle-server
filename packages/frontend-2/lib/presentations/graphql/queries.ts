import { graphql } from '~/lib/common/generated/gql/gql'

export const presentationAccessCheckQuery = graphql(`
  query PresentationAccessCheck($savedViewGroupId: ID!, $projectId: String!) {
    project(id: $projectId) {
      id
      savedViewGroup(id: $savedViewGroupId) {
        id
      }
    }
  }
`)

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
        ...PresentationLoading_LimitedWorkspace
      }
      savedViewGroup(id: $savedViewGroupId) {
        id
        title
        ...PresentationViewerPageWrapper_SavedViewGroup
        ...PresentationHeader_SavedViewGroup
        ...PresentationSlideList_SavedViewGroup
        ...PresentationPageWrapper_SavedViewGroup
        ...PresentationLoading_SavedViewGroup
        views(input: $input) {
          totalCount
          items {
            id
            name
            description
            thumbnailUrl
            projectId
            visibility
            ...PresentationInfoSidebar_SavedView
            ...UseSetupPresentationState_SavedView
            group {
              id
            }
          }
        }
      }
    }
  }
`)

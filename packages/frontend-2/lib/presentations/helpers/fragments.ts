import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment UsePresentation_Workspace on Workspace {
    id
    ...PresentationLeftSidebar_Workspace
  }

  fragment UsePresentation_SavedView on SavedView {
    id
    ...PresentationInfoSidebar_SavedView
  }

  fragment UsePresentation_SavedViewGroup on SavedViewGroup {
    id
    ...PresentationHeader_SavedViewGroup
    ...PresentationSlideListSlide_SavedViewGroup
    views(input: $savedViewGroupViewsInput) {
      items {
        id
        ...UsePresentation_SavedView
      }
    }
  }
`)

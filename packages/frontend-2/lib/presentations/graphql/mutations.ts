import { graphql } from '~/lib/common/generated/gql'

export const updatePresentationSlideMutation = graphql(`
  mutation UpdatePresentationSlide($input: UpdateSavedViewInput!) {
    projectMutations {
      savedViewMutations {
        updateView(input: $input) {
          id
          name
          description
        }
      }
    }
  }
`)

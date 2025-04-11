import { graphql } from '~~/lib/common/generated/gql'

export const setActiveWorkspaceMutation = graphql(`
  mutation SetActiveWorkspace($slug: String, $isProjectsActive: Boolean) {
    activeUserMutations {
      setActiveWorkspace(slug: $slug, isProjectsActive: $isProjectsActive)
    }
  }
`)

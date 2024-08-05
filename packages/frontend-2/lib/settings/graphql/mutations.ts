import { graphql } from '~~/lib/common/generated/gql'

export const settingsUpdateWorkspaceMutation = graphql(`
  mutation UpdateWorkspace($input: WorkspaceUpdateInput!) {
    workspaceMutations {
      update(input: $input) {
        description
        name
        id
      }
    }
  }
`)

export const deleteWorkspaceMutation = graphql(`
  mutation DeleteWorkspace($workspaceId: String!) {
    workspaceMutations {
      delete(workspaceId: $workspaceId)
    }
  }
`)

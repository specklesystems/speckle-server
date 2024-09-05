import gql from 'graphql-tag'

export const createProjectVersionMutation = gql`
  mutation CreateProjectVersion($input: CreateVersionInput!) {
    versionMutations {
      create(input: $input) {
        id
        message
        sourceApplication
        model {
          id
        }
        referencedObject
      }
    }
  }
`

export const markProjectVersionReceivedMutation = gql`
  mutation MarkProjectVersionReceived($input: MarkReceivedVersionInput!) {
    versionMutations {
      markReceived(input: $input)
    }
  }
`

import { gql } from 'apollo-server-express'

export const createProjectCommentMutation = gql`
  mutation CreateProjectComment($input: CreateCommentInput!) {
    commentMutations {
      create(input: $input) {
        id
        rawText
        text {
          doc
        }
        authorId
      }
    }
  }
`

import gql from 'graphql-tag'

export const basicProjectCommentFragment = gql`
  fragment BasicProjectComment on Comment {
    id
    rawText
    text {
      doc
    }
    authorId
  }
`

export const createProjectCommentMutation = gql`
  mutation CreateProjectComment($input: CreateCommentInput!) {
    commentMutations {
      create(input: $input) {
        ...BasicProjectComment
      }
    }
  }

  ${basicProjectCommentFragment}
`

export const createProjectCommentReplyMutation = gql`
  mutation CreateProjectCommentReply($input: CreateCommentReplyInput!) {
    commentMutations {
      reply(input: $input) {
        ...BasicProjectComment
      }
    }

    ${basicProjectCommentFragment}
  }
`

export const editProjectCommentMutation = gql`
  mutation EditProjectComment($input: EditCommentInput!) {
    commentMutations {
      edit(input: $input) {
        ...BasicProjectComment
      }
    }

    ${basicProjectCommentFragment}
  }
`

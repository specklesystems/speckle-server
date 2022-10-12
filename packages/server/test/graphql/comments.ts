import {
  CreateCommentMutation,
  CreateCommentMutationVariables,
  CreateReplyMutation,
  CreateReplyMutationVariables,
  GetCommentQuery,
  GetCommentQueryVariables,
  GetCommentsQuery,
  GetCommentsQueryVariables
} from '@/test/graphql/generated/graphql'
import { executeOperation } from '@/test/graphqlHelper'
import { ApolloServer, gql } from 'apollo-server-express'

const commentWithRepliesFragment = gql`
  fragment CommentWithReplies on Comment {
    id
    rawText
    text {
      doc
      attachments {
        id
        fileName
        streamId
      }
    }
    replies(limit: 10) {
      items {
        id
        text {
          doc
          attachments {
            id
            fileName
            streamId
          }
        }
      }
    }
  }
`

const createCommentMutation = gql`
  mutation CreateComment($input: CommentCreateInput!) {
    commentCreate(input: $input)
  }
`

const createReplyMutation = gql`
  mutation CreateReply($input: ReplyCreateInput!) {
    commentReply(input: $input)
  }
`

const getCommentQuery = gql`
  query GetComment($id: String!, $streamId: String!) {
    comment(id: $id, streamId: $streamId) {
      ...CommentWithReplies
    }
  }

  ${commentWithRepliesFragment}
`

const getCommentsQuery = gql`
  query GetComments($streamId: String!, $cursor: String) {
    comments(streamId: $streamId, limit: 10, cursor: $cursor) {
      totalCount
      cursor
      items {
        ...CommentWithReplies
      }
    }
  }

  ${commentWithRepliesFragment}
`

export const createComment = (
  apollo: ApolloServer,
  variables: CreateCommentMutationVariables
) =>
  executeOperation<CreateCommentMutation, CreateCommentMutationVariables>(
    apollo,
    createCommentMutation,
    variables
  )

export const createReply = (
  apollo: ApolloServer,
  variables: CreateReplyMutationVariables
) =>
  executeOperation<CreateReplyMutation, CreateReplyMutationVariables>(
    apollo,
    createReplyMutation,
    variables
  )

export const getComment = (apollo: ApolloServer, variables: GetCommentQueryVariables) =>
  executeOperation<GetCommentQuery, GetCommentQueryVariables>(
    apollo,
    getCommentQuery,
    variables
  )

export const getComments = (
  apollo: ApolloServer,
  variables: GetCommentsQueryVariables
) =>
  executeOperation<GetCommentsQuery, GetCommentsQueryVariables>(
    apollo,
    getCommentsQuery,
    variables
  )

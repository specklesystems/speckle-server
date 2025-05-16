import { gql } from 'graphql-tag'

/**
 * Commits/Versions
 */

export const limitedPersonalProjectCommentFragment = gql`
  fragment LimitedPersonalProjectComment on Comment {
    id
    rawText
    createdAt
    text {
      doc
      type
    }
  }
`

export const limitedPersonalProjectVersionFragment = gql`
  fragment LimitedPersonalProjectVersion on Version {
    id
    createdAt
    message
    referencedObject
    commentThreads {
      totalCount
      items {
        ...LimitedPersonalProjectComment
      }
    }
  }

  ${limitedPersonalProjectCommentFragment}
`

export const getLimitedPersonalProjectVersionsQuery = gql`
  query GetLimitedPersonalProjectVersions($projectId: String!) {
    project(id: $projectId) {
      versions {
        totalCount
        items {
          ...LimitedPersonalProjectVersion
        }
      }
    }
  }

  ${limitedPersonalProjectVersionFragment}
`

export const getLimitedPersonalProjectVersionQuery = gql`
  query GetLimitedPersonalProjectVersion($projectId: String!, $versionId: String!) {
    project(id: $projectId) {
      version(id: $versionId) {
        ...LimitedPersonalProjectVersion
      }
    }
  }

  ${limitedPersonalProjectVersionFragment}
`

export const limitedPersonalStreamCommitFragment = gql`
  fragment LimitedPersonalStreamCommit on Commit {
    id
    message
    referencedObject
    createdAt
  }
`

export const getLimitedPersonalStreamCommitsQuery = gql`
  query GetLimitedPersonalStreamCommits($streamId: String!) {
    stream(id: $streamId) {
      commits {
        totalCount
        items {
          ...LimitedPersonalStreamCommit
        }
      }
    }
  }

  ${limitedPersonalStreamCommitFragment}
`

/**
 * Comments
 */

export const getLimitedPersonalProjectCommentsQuery = gql`
  query GetLimitedPersonalProjectComments($projectId: String!) {
    project(id: $projectId) {
      commentThreads {
        totalCount
        items {
          ...LimitedPersonalProjectComment
        }
      }
    }
  }

  ${limitedPersonalProjectCommentFragment}
`

export const getLimitedPersonalProjectCommentQuery = gql`
  query GetLimitedPersonalProjectComment($projectId: String!, $commentId: String!) {
    project(id: $projectId) {
      comment(id: $commentId) {
        ...LimitedPersonalProjectComment
      }
    }
  }

  ${limitedPersonalProjectCommentFragment}
`

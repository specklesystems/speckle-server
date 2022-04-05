import gql from 'graphql-tag'

export const serverInfoQuery = gql`
  query ServerInfo {
    serverInfo {
      name
    }
  }
`

export const streamCommitQuery = gql`
  query Stream($id: String!, $commit: String!) {
    stream(id: $id) {
      id
      name
      description
      isPublic
      commit(id: $commit) {
        referencedObject
      }
    }
  }
`

export const branchLastCommitQuery = gql`
  query Stream($id: String!, $branch: String!) {
    stream(id: $id) {
      id
      name
      description
      isPublic
      branch(name: $branch) {
        commits(limit: 1) {
          totalCount
          items {
            referencedObject
          }
        }
      }
    }
  }
`

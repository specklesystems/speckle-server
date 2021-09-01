import gql from "graphql-tag";

export const serverInfoQuery = `
  query ServerInfo {
    serverInfo {
      name
    }
  }
`

export const streamCommitQuery = `
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

export const branchLastCommitQuery = `
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



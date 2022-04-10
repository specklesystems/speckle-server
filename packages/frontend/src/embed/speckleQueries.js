// NOTE: these are used in a simple fetch request, they do not need the gql literal!
// The embed app does not use any apollo gql dependencies.
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

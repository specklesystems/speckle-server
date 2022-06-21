const SERVER_URL = window.location.origin

// Unauthorised fetch, without token to prevent use of localStorage or exposing elsewhere.
async function speckleFetch(query, variables) {
  const res = await fetch(`${SERVER_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      variables
    })
  })
  return await res.json()
}

export const getServerInfo = () => speckleFetch(serverInfoQuery)

export const getStreamObj = (id) => speckleFetch(streamQuery, { id })

export const getBranchObj = (id, branch) => speckleFetch(branchQuery, { id, branch })

export const getCommitObj = (id, commit) => speckleFetch(commitQuery, { id, commit })

const serverInfoQuery = `
  query ServerInfo {
    serverInfo {
      name
    }
  }
`

const streamQuery = `
  query Stream($id: String!) {
    stream(id: $id) {
      commits(limit: 1) {
        totalCount
        items {
          referencedObject
        }
      }
    }
  }
`

const branchQuery = `
  query Stream($id: String!, $branch: String!) {
    stream(id: $id) {
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

const commitQuery = `
  query Stream($id: String!, $commit: String!) {
    stream(id: $id) {
      commit(id: $commit) {
        referencedObject
      }
    }
  }
`

import { SendResult } from '../..'

interface CreateCommitParams {
  serverUrl: string
  projectId: string
  token: string
  modelName?: string
}

export async function createCommit(
  res: SendResult,
  { serverUrl, projectId, token, modelName }: CreateCommitParams
) {
  const response = await fetch(new URL('/graphql', serverUrl).toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
        mutation CreateCommit($commit: CommitCreateInput!) {
          commitCreate(commit: $commit)
        }
      `,
      variables: {
        commit: {
          branchName: modelName || 'main',
          message: 'Good morning!',
          objectId: res.hash,
          streamId: projectId
        }
      }
    })
  })

  return response.json()
}

interface CreateProjectParams {
  serverUrl: string
  token: string
}

export async function createProject({ serverUrl, token }: CreateProjectParams) {
  const response = await fetch(new URL('/graphql', serverUrl).toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
        mutation createProject($name: String, $description: String) {
          projectMutations {
            create(input: {name: $name, description: $description}) {
              id
            }
          }
        }
      `,
      variables: {
        create: {
          name: `Test project ${Math.random() * 1000}`,
          description: 'This project was created by the object sender example.'
        }
      }
    })
  })

  return response.json()
}

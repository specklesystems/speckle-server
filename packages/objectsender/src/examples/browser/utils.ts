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
  const response = await fetch(serverUrl + '/graphql', {
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

  await response.json()
}

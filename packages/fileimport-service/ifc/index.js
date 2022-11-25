const { fetch } = require('undici')
const Parser = require('./parser')
const ServerAPI = require('./api.js')

async function parseAndCreateCommit({
  data,
  streamId,
  branchName = 'uploads',
  userId,
  message = 'Manual IFC file upload'
}) {
  const serverApi = new ServerAPI({ streamId })
  const myParser = new Parser({ serverApi })

  const { id, tCount } = await myParser.parse(data)

  const commit = {
    streamId,
    branchName,
    objectId: id,
    message,
    sourceApplication: 'IFC',
    totalChildrenCount: tCount
  }

  const branch = await serverApi.getBranchByNameAndStreamId({
    streamId,
    name: branchName
  })

  if (!branch) {
    await serverApi.createBranch({
      name: branchName,
      streamId,
      description: branchName === 'uploads' ? 'File upload branch' : null,
      authorId: userId
    })
  }

  const userToken = process.env.USER_TOKEN

  const serverBaseUrl = process.env.SPECKLE_SERVER_URL || 'http://localhost:3000'
  const response = await fetch(serverBaseUrl + '/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      query:
        'mutation createCommit( $myCommitInput: CommitCreateInput!) { commitCreate( commit: $myCommitInput ) }',
      variables: {
        myCommitInput: commit
      }
    })
  })

  const json = await response.json()
  // eslint-disable-next-line no-console
  console.log(json)

  return json.data.commitCreate
}

module.exports = { parseAndCreateCommit }

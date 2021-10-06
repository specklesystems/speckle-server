const fetch = require( 'node-fetch' )
const Parser = require( './parser' )
const ServerAPI = require( './api.js' )

async function parseAndCreateCommit( { data, streamId, branchName = 'uploads', userId, message = 'Manual IFC file upload' } ) {
  const serverApi = new ServerAPI( { streamId } )
  const myParser = new Parser( { serverApi } )
  
  const { id, tCount } = await myParser.parse( data )
  
  let commit = {
    streamId: streamId,
    branchName: branchName,
    objectId: id,
    message: message,
    sourceApplication: 'IFC',
    totalChildrenCount: tCount
  }

  let branch = await serverApi.getBranchByNameAndStreamId( { streamId: streamId, name: branchName } )
  
  if( !branch ) {
    await serverApi.createBranch( {
      name: branchName, 
      streamId: streamId,
      description: branchName === 'uploads' ? 'File upload branch' : null,
      authorId: userId
    } )
  }

  let userToken = process.env.USER_TOKEN

  let server_base_url = process.env.SPECKLE_SERVER_URL || 'http://localhost:3000'
  const response = await fetch( server_base_url + '/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify( {
      query: 'mutation createCommit( $myCommitInput: CommitCreateInput!) { commitCreate( commit: $myCommitInput ) }',
      variables:{
        myCommitInput: commit
      }
    } )
  } )

  let json = await response.json()
  console.log( json )

  return json.data.commitCreate
}

module.exports = { parseAndCreateCommit }

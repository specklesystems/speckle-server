const fs = require( 'fs' )
const fetch = require( 'node-fetch' )
const Parser = require( './parser' )
const ServerAPI = require( './api.js' )

// Hard coded local vars
const streamId = '27d29ef972'
// const branchName = 'main'
const userId = 'e24eb8e7e4'

// NOTE: not all the files below are present in the repo. Moreover, not all of the ones in the repo
// work properly, as we're dependent on the web-ifc library, whose support is partially limited, and/or
// the files are corrupt/do not pass validation. Welcome to IFC!
// const data = fs.readFileSync( './ifcs/20160414office_model_CV2_fordesign.ifc' )
// const data = fs.readFileSync( './ifcs/hospital.ifc' )
// const data = fs.readFileSync( './ifcs/primark.ifc' )
const data = fs.readFileSync( './ifcs/231110AC11-Institute-Var-2-IFC.ifc' )
// const data = fs.readFileSync( './ifcs/small.ifc' )
// const data = fs.readFileSync( './ifcs/example.ifc' )
// const data = fs.readFileSync( './ifcs/steelplates.ifc' )
// const data = fs.readFileSync( './ifcs/piping.ifc' )
// const data = fs.readFileSync( './ifcs/railing.ifc' )
// const data = fs.readFileSync( './ifcs/hall.ifc' )
// const data = fs.readFileSync( './ifcs/231110ADT-FZK-Haus-2005-2006.ifc' )
// const data = fs.readFileSync( './ifcs/crazy.ifc' )

async function parseAndCreateCommit( { data, streamId, branchName = 'uploads', userId, message = 'Manual IFC file upload' } ) {
  const serverApi = new ServerAPI( { streamId } )
  const myParser = new Parser( { serverApi } )
  
  const { id, tCount } = await myParser.parse( data )
  
  let commit = {
    streamId: streamId,
    branchName: branchName,
    objectId: id,
    // authorId: userId, // not needed anymore (using raw api call for this)
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

  let { token:userToken } = await serverApi.createToken( { userId, name: 'temp upload token', scopes: [ 'streams:write' ], lifespan: 3000 } )


  // TODO: in case there's a custom server port, perhaps we need to use an env variable here instead of the default 3000?
  const response = await fetch( 'http://localhost:3000/graphql', {
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

  await serverApi.revokeTokenById( userToken )
}

parseAndCreateCommit( {
  data, 
  streamId,
  userId
} )

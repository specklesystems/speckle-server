const fs = require( 'fs' )
const Parser = require( './parser' )
const ObjectSaver = require( './api.js' )

// Hard coded local vars
const streamId = '27d29ef972'
const branchName = 'main'
const userId = 'e24eb8e7e4'

// const data = fs.readFileSync( './ifcs/20160414office_model_CV2_fordesign.ifc' )
// const data = fs.readFileSync( './ifcs/231110AC11-Institute-Var-2-IFC.ifc' )
// const data = fs.readFileSync( './ifcs/small.ifc' )
// const data = fs.readFileSync( './ifcs/example.ifc' )
// const data = fs.readFileSync( './ifcs/steelplates.ifc' )
const data = fs.readFileSync( './ifcs/railing.ifc' )
// const data = fs.readFileSync( './ifcs/231110ADT-FZK-Haus-2005-2006.ifc' )
// const data = fs.readFileSync( './ifcs/202103162102_cira.ifc' )

async function parseAndCreateCommit( { data, streamId, branchName = 'uploads', userId, message = 'Manual IFC file upload' } ) {
  const myParser = new Parser( { objectSaver: new ObjectSaver({ streamId }) } )
  const { id, tCount } = await myParser.parse( data )
  
  // async createCommitByBranchName( { streamId, branchName, objectId, authorId, message, sourceApplication, totalChildrenCount, parents } ) {
  let commit = {
    streamId: streamId,
    branchName: branchName,
    objectId: id,
    authorId: userId,
    message: message,
    sourceApplication: 'IFC',
    totalChildrenCount: tCount
  }


  console.log( commit )
  // TODO: save commit, ensuring branch exists first.
}

parseAndCreateCommit({
  data, 
  streamId,
  branchName,
  userId
})


// const parser = new Parser( { objectSaver: new ObjectSaver({}) } )
// async function load() {
//   const parsed = await parser.parse( data )
//   fs.writeFileSync( 'foo.txt', JSON.stringify( parsed ) )

//   console.log( parsed )
// }

// load()

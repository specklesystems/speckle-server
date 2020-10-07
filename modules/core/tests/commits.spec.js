/* istanbul ignore file */
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )

const appRoot = require( 'app-root-path' )
const { init } = require( `${appRoot}/app` )
const knex = require( `${appRoot}/db/knex` )

const expect = chai.expect
chai.use( chaiHttp )


const { createUser } = require( '../services/users' )
const { createStream, getStream, updateStream, deleteStream } = require( '../services/streams' )
const { createObject, createObjects } = require( '../services/objects' )
const { createBranch } = require( '../services/branches' )

const {
  createCommitByBranchName,
  createCommitByBranchId,
  updateCommit,
  getCommitById,
  deleteCommit,
  getCommitsTotalCountByBranchName,
  getCommitsByBranchId,
  getCommitsByBranchName,
  getCommitsByStreamId,
  getCommitsTotalCountByStreamId,
  getCommitsByUserId,
  getCommitsTotalCountByUserId
} = require( '../services/commits' )

describe( 'Commits', ( ) => {

  let user = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie4342@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  let stream = {
    name: 'Test Stream References',
    description: 'Whatever goes in here usually...'
  }

  let testObject = {
    foo: 'bar',
    baz: 'qux'
  }

  let testObject2 = {
    foo: 'bar3',
    baz: 'qux3'
  }

  let testObject3 = {
    foo: 'bar4',
    baz: 'qux5'
  }

  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    user.id = await createUser( user )
    stream.id = await createStream( { ...stream, ownerId: user.id } )

    testObject.id = await createObject( testObject )
    testObject2.id = await createObject( testObject2 )
    testObject3.id = await createObject( testObject3 )
  } )

  after( async ( ) => {} )

  let commitId1, commitId2, commitId3

  it( 'Should create a commit by branch name', async ( ) => {
    commitId1 = await createCommitByBranchName( { streamId: stream.id, branchName: 'main', message: 'first commit', objectId: testObject.id, authorId: user.id } )
    expect( commitId1 ).to.be.a.string
  } )

  it( 'Should create a commit with a previous commit id', async ( ) => {
    commitId2 = await createCommitByBranchName( { streamId: stream.id, branchName: 'main', message: 'second commit', objectId: testObject2.id, authorId: user.id, previousCommitIds: [ commitId1 ] } )
    expect( commitId2 ).to.be.a.string

    commitId3 = await createCommitByBranchName( { streamId: stream.id, branchName: 'main', message: 'third commit', objectId: testObject3.id, authorId: user.id, previousCommitIds: [ commitId1, commitId2 ] } )

    expect( commitId3 ).to.be.a.string
  } )

  it( 'Should update a commit', async ( ) => {
    let res = await updateCommit( { id: commitId1, message: 'FIRST COMMIT YOOOOOO' } )
    expect( res ).to.equal( 1 )
  } )

  it( 'Should delete a commit', async ( ) => {
    let tempCommit = await createCommitByBranchName( { streamId: stream.id, branchName: 'main', message: 'temp commit', objectId: testObject.id, authorId: user.id } )

    let res = await deleteCommit( { id: tempCommit } )
    expect( res ).to.equal( 1 )

  } )

  it( 'Should get a commit by id', async ( ) => {
    let cm = await getCommitById( { id: commitId1 } )
    expect( cm.message ).to.equal( 'FIRST COMMIT YOOOOOO' )
  } )

  it( 'Should get the commits from a branch', async ( ) => {
    for ( let i = 0; i < 10; i++ ) {
      let t = { qux: i }
      t.id = await createObject( t )
      await createCommitByBranchName( { streamId: stream.id, branchName: 'main', message: `commit # ${i+3}`, objectId: t.id, authorId: user.id } )
    }

    let { commits, cursor } = await getCommitsByBranchName( { streamId: stream.id, branchName: 'main', limit: 2 } )
    expect( commits ).to.be.an( 'array' )
    expect( commits.length ).to.equal( 2 )

    let { commits: commits2, cursor: cursor2 } = await getCommitsByBranchName( { streamId: stream.id, branchName: 'masmainter', limit: 5, cursor: cursor } )
    expect( commits2.length ).to.equal( 5 )
  } )

  it( 'Should get the commit count from a branch', async ( ) => {
    let c = await getCommitsTotalCountByBranchName( { streamId: stream.id, branchName: 'main' } )
    expect( c ).to.equal( 13 )
  } )

  it( 'Should get the commits from a stream', async ( ) => {
    await createBranch( { name: 'dim/dev', streamId: stream.id, authorId: user.id } )
    for ( let i = 0; i < 10; i++ ) {
      let t = { thud: i }
      t.id = await createObject( t )
      await createCommitByBranchName( { streamId: stream.id, branchName: 'dim/dev', message: `pushed something # ${i+3}`, objectId: t.id, authorId: user.id } )
    }

    let { commits, cursor } = await getCommitsByStreamId( { streamId: stream.id, limit: 10 } )
    let { commits: commits2, cursor: cursor2 } = await getCommitsByStreamId( { streamId: stream.id, limit: 20, cursor: cursor } )

    expect( commits.length ).to.equal( 10 )
    expect( commits2.length ).to.equal( 13 )
  } )

  it( 'Should get the commit count of a stream', async ( ) => {
    let c = await getCommitsTotalCountByStreamId( { streamId: stream.id } )
    expect( c ).to.equal( 23 )
  } )

  it( 'Should get the commits of a user', async ( ) => {
    let { commits, cursor } = await getCommitsByUserId( { userId: user.id, limit: 3 } )

    let { commits: commits2, cursor: cursor2 } = await getCommitsByUserId( { userId: user.id, limit: 100, cursor: cursor } )

    expect( commits.length ).to.equal( 3 )
    expect( commits2.length ).to.equal( 20 )
  } )

  it( 'Should get the public commits of an user only', async ( ) => {
    let privateStreamId = await createStream( { name: 'private', isPublic: false, ownerId: user.id } )
    let commitId = await createCommitByBranchName( { streamId: privateStreamId, branchName: 'main', message: 'first commit', objectId: testObject.id, authorId: user.id } )

    let { commits, cursor } = await getCommitsByUserId( { userId: user.id, limit: 1000 } )
    expect( commits.length ).to.equal( 23 )
  } )

  it( 'Should get the commit count of an user', async ( ) => {
    let c = await getCommitsTotalCountByUserId( { userId: user.id } )
    expect( c ).to.equal( 24 )
  } )


} )

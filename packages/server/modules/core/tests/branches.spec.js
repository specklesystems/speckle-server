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
const { createObject, createObjects, getObject, getObjects } = require( '../services/objects' )
const {
  createBranch,
  updateBranch,
  getBranchById,
  getBranchesByStreamId,
  getBranchByNameAndStreamId,
  deleteBranchById
} = require( '../services/branches' )


describe( 'Branches @core-branches', () => {
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

  before( async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()

    await init()

    user.id = await createUser( user )
    stream.id = await createStream( { ...stream, ownerId: user.id } )
    testObject.id = await createObject( stream.id, testObject )
  } )

  after( async () => {
    await knex.migrate.rollback()
  } )

  let branch = { name: 'dim/dev' }

  it( 'Should create a branch', async () => {
    branch.id = await createBranch( { ...branch, streamId: stream.id, authorId: user.id } )
    expect( branch.id ).to.be.not.null
    expect( branch.id ).to.be.a.string
  } )

  it( 'Should not allow duplicate branch names', async () => {
    try {
      await createBranch( { name: 'main', streamId: stream.id, authorId: user.id } )
      assert.fail( 'Duplicate branches should not be allowed.' )
    } catch ( err ) {
      expect( err.message ).to.contain( 'duplicate key value violates unique constraint' )
    }
  } )

  it( 'Should not allow branch names starting with # or /', async () => {
    try {
      await createBranch( { name: '/pasta', streamId: stream.id, authorId: user.id } )
      assert.fail( 'Illegal branch name passed through.' )
    } catch ( err ) {
      expect( err.message ).to.contain( 'names cannot start with # or /' )
    }

    try {
      await createBranch( { name: '#rice', streamId: stream.id, authorId: user.id } )
      assert.fail( 'Illegal branch name passed through.' )
    } catch ( err ) {
      expect( err.message ).to.contain( 'names cannot start with # or /' )
    }

    try {
      await updateBranch( { id: branch.id, name: '/super/part/two' } )
      assert.fail( 'Illegal branch name passed through in update operation.' )
    } catch ( err ) {
      expect( err.message ).to.contain( 'names cannot start with # or /' )
    }

    try {
      await updateBranch( { id: branch.id, name: '#super#part#three' } )
      assert.fail( 'Illegal branch name passed through in update operation.' )
    } catch ( err ) {
      expect( err.message ).to.contain( 'names cannot start with # or /' )
    }
  } )

  it( 'Branch names should be case insensitive (always lowercase)', async () => {
    let id = await createBranch( { name: 'CaseSensitive', streamId: stream.id, authorId: user.id } )

    let b = await getBranchByNameAndStreamId( { streamId: stream.id, name: 'casesensitive' } )
    expect( b.name ).to.equal( 'casesensitive' )

    let bb = await getBranchByNameAndStreamId( { streamId: stream.id, name: 'CaseSensitive' } )
    expect( bb.name ).to.equal( 'casesensitive' )

    let bbb = await getBranchByNameAndStreamId( { streamId: stream.id, name: 'CASESENSITIVE' } )
    expect( bbb.name ).to.equal( 'casesensitive' )

    // cleanup
    await deleteBranchById( { id, streamId: stream.id } )
  } )

  it( 'Should get a branch', async () => {
    let myBranch = await getBranchById( { id: branch.id } )
    expect( myBranch.authorId ).to.equal( user.id )
    expect( myBranch.streamId ).to.equal( stream.id )
  } )

  it( 'Should update a branch', async () => {
    await updateBranch( { id: branch.id, description: 'lorem ipsum' } )

    let b1 = await getBranchById( { id: branch.id } )
    expect( b1.description ).to.equal( 'lorem ipsum' )
  } )

  it( 'Should get all stream branches', async () => {
    await createBranch( { name: 'main-faster', streamId: stream.id, authorId: user.id } )
    await createBranch( { name: 'main-blaster', streamId: stream.id, authorId: user.id } )
    await createBranch( { name: 'blaster-farter', streamId: stream.id, authorId: user.id } )

    let { items, cursor, totalCount } = await getBranchesByStreamId( { streamId: stream.id } )
    expect( items ).to.have.lengthOf( 5 )
    expect( cursor ).to.exist
    expect( totalCount ).to.exist
  } )

  it( 'Should delete a branch', async () => {
    await deleteBranchById( { id: branch.id, streamId: stream.id } )
    let { items } = await getBranchesByStreamId( { streamId: stream.id } )
    expect( items ).to.have.lengthOf( 4 )
  } )

  it( 'Should NOT delete the main branch', async () => {
    let b = await getBranchByNameAndStreamId( { streamId: stream.id, name: 'main' } )
    try {
      await deleteBranchById( { id: b.id, streamId: stream.id } )
      assert.fail()
    } catch ( e ) {
      // pass
    }
  } )

  it( 'Should return branches in time createdAt order, MAIN first', async () => {
    let { items } = await getBranchesByStreamId( { streamId: stream.id } )
    expect( items[0].name ).to.equal( 'main' )
  
    let branch = items[3]
    await updateBranch( { id: branch.id, description: 'lorem ipsum' } )
    let cursor = new Date().toISOString()
    let got = await getBranchesByStreamId( { streamId: stream.id, cursor: cursor } ) 

    expect( got.items[3].name ).to.equal( branch.name )
    expect( got.items[0].name ).to.equal( 'main' )
  } )
} )
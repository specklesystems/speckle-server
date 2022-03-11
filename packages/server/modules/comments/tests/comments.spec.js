/* istanbul ignore file */
const expect = require( 'chai' ).expect
const crs = require( 'crypto-random-string' )

const appRoot = require( 'app-root-path' )
const { beforeEachContext } = require( `${appRoot}/test/hooks` )
const { createUser } = require( `${appRoot}/modules/core/services/users` )
const { createStream } = require( `${appRoot}/modules/core/services/streams` )
const { createCommitByBranchName } = require( `${appRoot}/modules/core/services/commits` )

const { createObject } = require( `${appRoot}/modules/core/services/objects` )
const { createComment, getComments } = require( '../services' )

describe( 'Comments @comments', () => {
  let user = {
    name: 'The comment wizard',
    email: 'comment@wizard.ry',
    password: 'i did not like Rivendel wine :('
  }

  let stream = {
    name: 'Commented stream',
    description: 'Chit chats over here'
  }

  let testObject1 = {
    foo: 'bar'
  }

  let testObject2 = {
    foo: 'barbar',
    baz: 123
  }
  let commitId1, commitId2

  before( async () => {
    await beforeEachContext() 
    
    user.id = await createUser( user )
    stream.id = await createStream( { ...stream, ownerId: user.id } )

    testObject1.id = await createObject( stream.id, testObject1 )
    testObject2.id = await createObject( stream.id, testObject2 )

    commitId1 = await createCommitByBranchName( { streamId: stream.id, branchName: 'main', message: 'first commit', sourceApplication: 'tests', objectId: testObject1.id, authorId: user.id } )
    commitId2 = await createCommitByBranchName( { streamId: stream.id, branchName: 'main', message: 'first commit', sourceApplication: 'tests', objectId: testObject2.id, authorId: user.id } )
  } )

  it( 'Should not be allowed to comment without specifying atleast one target resource', async ( ) => {
    return await createComment( { 
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [],
        text: crs( { length: 10 } ),
        data: { justSome: crs( { length: 10 } ) }
      }
    } )
      .then( () => { throw new Error( 'This should have been rejected' ) } )
      .catch( error => expect( error.message ).to.be.equal( 'Must specify atleast one resource as the comment target' ) )  
  } )
  it( 'Should not be able to comment resources that do not belong to the input streamId', async ( ) => {
    // need to check streamId - commit link
    // need to check streamId - object link
    // need to check streamId - stream match
    // need to check comment reply recursively? that sounds too much of an effort 
    await createComment( { 
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: 'almost the stream.id', resourceType: 'stream' },
          { resourceId: commitId1, resourceType: 'commit' },
          { resourceId: testObject1.id, resourceType: 'object' } 
        ],
        text: crs( { length: 10 } ),
        data: { justSome: crs( { length: 10 } ) }
      }
    } )
      .then( () => { throw new Error( 'This should have been rejected' ) } )
      .catch( error => expect( error.message ).to.be.equal( 'Input streamId doesn\'t match the stream resource.resourceId' ) )
    
    //add the checks from above
    expect( 1 ).to.equal( 2 )
  } )
  it( 'Should not be allowed to comment targeting multiple streams as a resource', async ( ) => {
    return await createComment( { 
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: commitId1, resourceType: 'commit' },
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: testObject1.id, resourceType: 'object' } 
        ],
        text: crs( { length: 10 } ),
        data: { justSome: crs( { length: 10 } ) }
      }
    } )
      .then( () => { throw new Error( 'This should have been rejected' ) } )
      .catch( error => expect( error.message ).to.be.equal( 'Commenting on multiple streams is not supported' ) )
  } )
  it( 'Should not be allowed to comment on non existing resources', async () => {
    const nonExistentResources = [
      {
        streamId: 'this doesnt exist dummy',
        resources: [
          { resourceId: 'this doesnt exist dummy', resourceType: 'stream' },
        ],
        text: null,
        data: null
      },
      {
        streamId: stream.id,
        resources: [
          { resourceId:  stream.id, resourceType: 'stream' },
          { resourceId: 'this doesnt exist dummy', resourceType: 'commit' },
        ],
        text: null,
        data: null
      },
      {
        streamId: stream.id,
        resources: [
          { resourceId:  stream.id, resourceType: 'stream' },
          { resourceId: 'this doesnt exist dummy', resourceType: 'object' },
        ],
        text: null,
        data: null
      },
      {
        streamId: stream.id,
        resources: [
          { resourceId:  stream.id, resourceType: 'stream' },
          { resourceId: 'this doesnt exist dummy', resourceType: 'comment' },
        ],
        text: null,
        data: null
      },
    ]
    for ( const input of nonExistentResources ) {
      await createComment( { userId: user.id, input } )
        .then( () => { throw new Error( 'This should have been rejected' ) } )
        .catch( error => expect( error.message ).to.contain( ': this doesnt exist dummy doesn\'t exist, you cannot comment on it' ) )
    }
  } )
  it( 'Should not be allowed to comment on an non supported resource type', async () => {
    await createComment( { 
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: 'jubbjabb', resourceType: 'flux capacitor' },
        ],
        text: crs( { length: 10 } ),
        data: { justSome: crs( { length: 10 } ) }
      } } )
      .then( () => { throw new Error( 'This should have been rejected' ) } )
      .catch( error => expect( error.message ).to.equal( 'resource type flux capacitor is not supported as a comment target' ) )
  } )

  it( 'Should be able to comment on valid resources in any permutation', async () => {
    //comment on branches too!!!
    const resourceCombinations = [
      [
        { resourceId: stream.id, resourceType: 'stream' } 
      ],
      [
        { resourceId: stream.id, resourceType: 'stream' },
        { resourceId: commitId1, resourceType: 'commit' } 
      ],
      [
        { resourceId: stream.id, resourceType: 'stream' },
        { resourceId: commitId1, resourceType: 'commit' },
        { resourceId: testObject1.id, resourceType: 'object' } 
      ],
      [
        // object overlay on object
        { resourceId: stream.id, resourceType: 'stream' },
        { resourceId: testObject1.id, resourceType: 'object' },
        { resourceId: testObject2.id, resourceType: 'object' } 
      ],
      [
        // an object overlayed on a commit
        { resourceId: stream.id, resourceType: 'stream' },
        { resourceId: commitId1, resourceType: 'commit' },
        { resourceId: testObject2.id, resourceType: 'object' } 
      ],
      [
        // an object overlayed on a commit
        { resourceId: stream.id, resourceType: 'stream' },
        { resourceId: commitId1, resourceType: 'commit' },
        { resourceId: testObject1.id, resourceType: 'object' },
        { resourceId: testObject2.id, resourceType: 'object' } 
      ],
      [
        { resourceId: stream.id, resourceType: 'stream' },
        { resourceId: commitId1, resourceType: 'commit' },
        { resourceId: commitId2, resourceType: 'commit' },
        { resourceId: testObject1.id, resourceType: 'object' }        
      ]
    ]

    // yeah i know, Promise.all, but this is easier to debug...
    for ( const resources of resourceCombinations ) {
      const commentId = await createComment( { 
        userId: user.id,
        input: {
          streamId: stream.id,
          resources,
          text: crs( { length: 10 } ),
          data: { justSome: crs( { length: 10 } ) }
        }
      } )
      expect( commentId ).to.exist
    }
  } )
  it( 'Should not return the same comment multiple times for multi resource comments', async () => {
    const localObjectId = await createObject( stream.id, { testObject: 1 } )

    const commentCount = 3
    for ( let i = 0; i < commentCount; i++ ) {
      await createComment( { 
        userId: user.id,
        input: {
          streamId: stream.id,
          resources: [
            { resourceId: stream.id, resourceType: 'stream' },
            { resourceId: commitId1, resourceType: 'commit' },
            { resourceId: localObjectId, resourceType: 'object' }
          ],
          text: crs( { length: 10 } ),
          data: { justSome: crs( { length: 10 } ) }
        }
      } )
    }

    const comments = await getComments( { streamId: stream.id, resources: [
      { resourceId: commitId1, resourceType: 'commit' },
      { resourceId: localObjectId, resourceType: 'object' }
    ] } )
    expect( comments.items ).to.have.lengthOf( commentCount )
  } )
  it( 'Should handle cursor and limit for queries', async ( ) => {
    const localObjectId = await createObject( stream.id, { testObject: 'something completely different' } )

    let createdComments = []
    const commentCount = 10
    for ( let i = 0; i < commentCount; i++ ) {
      createdComments.push( await createComment( { 
        userId: user.id,
        input: {
          streamId: stream.id,
          resources: [
            { resourceId: stream.id, resourceType: 'stream' },
            { resourceId: commitId1, resourceType: 'commit' },
            { resourceId: localObjectId, resourceType: 'object' }
          ],
          text: crs( { length: 10 } ),
          data: { justSome: crs( { length: 10 } ) }
        }
      } ) )
      await new Promise( resolve => setTimeout( resolve, 500 ) )
    } 

    let comments = await getComments( { 
      streamId: stream.id,
      resources: [
        { resourceId: commitId1, resourceType: 'commit' },
        { resourceId: localObjectId, resourceType: 'object' }
      ],
      limit : 2 
    } )
    expect( comments.items ).to.have.lengthOf( 2 )
    expect( createdComments.slice( 0, 2 ) ).deep.to.equal( comments.items.map( c => c.id ) )

    const cursor = comments.items[1].createdAt
    comments = await getComments( { 
      streamId: stream.id,
      resources: [
        { resourceId: commitId1, resourceType: 'commit' },
        { resourceId: localObjectId, resourceType: 'object' }
      ],
      limit : 2,
      cursor
    } )
    expect( comments.items ).to.have.lengthOf( 2 )
    expect( createdComments.slice( 2, 4 ) ).deep.to.equal( comments.items.map( c => c.id ) )
  } )
  it( 'Should handle very  and limit for queries' )
  it( 'Should properly return replies for a comment' )
  it( 'Should return all the referenced resources for a comment' )
  it( 'Should be able to edit a comment text and its context???' )
  it( 'Should not be allowed to edit a not existing comment' )
  it( 'Should be able to archive a comment' )
  it( 'Replies to archived comment should be archived, when a parent is archived' )
  it( 'Should not be allowed to archive a not existing comment' )
  it( 'Should not return archived comments in plain queries' )
  it( 'Should return archived comments if explicitly asked for them' )
  it( 'Return value from get comments and get comment should match in data' )
  it( 'Should publish events to pubsub, test it by registering a subscriber' )
  it( 'Should be able to write a short novel as comment text' )
} )
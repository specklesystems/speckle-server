/* istanbul ignore file */
const expect = require( 'chai' ).expect
const crs = require( 'crypto-random-string' )

const appRoot = require( 'app-root-path' )
const { beforeEachContext } = require( `${appRoot}/test/hooks` )
const { createUser } = require( `${appRoot}/modules/core/services/users` )
const { createStream } = require( `${appRoot}/modules/core/services/streams` )
const { createCommitByBranchName } = require( `${appRoot}/modules/core/services/commits` )

const { createObject } = require( `${appRoot}/modules/core/services/objects` )
const { createComment, getComments, getComment, archiveComment } = require( '../services' )

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

  it( 'Should not be allowed to comment without specifying atleast one target resource', async () => {
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
  it( 'Should not be able to comment resources that do not belong to the input streamId', async () => {
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
  it( 'Should not be allowed to comment targeting multiple streams as a resource', async () => {
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
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: 'this doesnt exist dummy', resourceType: 'commit' },
        ],
        text: null,
        data: null
      },
      {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: 'this doesnt exist dummy', resourceType: 'object' },
        ],
        text: null,
        data: null
      },
      {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
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
      }
    } )
      .then( () => { throw new Error( 'This should have been rejected' ) } )
      .catch( error => expect( error.message ).to.equal( 'resource type flux capacitor is not supported as a comment target' ) )
  } )

  it( 'Should be able to comment on valid resources in any permutation', async () => {
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

    const comments = await getComments( {
      streamId: stream.id, resources: [
        { resourceId: commitId1, resourceType: 'commit' },
        { resourceId: localObjectId, resourceType: 'object' }
      ]
    } )
    expect( comments.items ).to.have.lengthOf( commentCount )
  } )
  it( 'Should handle cursor and limit for queries', async () => {
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
      await new Promise( resolve => setTimeout( resolve, 50 ) )
    }

    let comments = await getComments( {
      streamId: stream.id,
      resources: [
        { resourceId: commitId1, resourceType: 'commit' },
        { resourceId: localObjectId, resourceType: 'object' }
      ],
      limit: 2
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
      limit: 2,
      cursor
    } )
    expect( comments.items ).to.have.lengthOf( 2 )
    expect( createdComments.slice( 2, 4 ) ).deep.to.equal( comments.items.map( c => c.id ) )
  } )
  it( 'Should properly return replies for a comment', async () => {
    const streamCommentId1 = await createComment( {
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' }
        ],
        text: crs( { length: 10 } ),
        data: { justSome: crs( { length: 10 } ) }
      }
    } )

    const commentId1 = await createComment( {
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: streamCommentId1, resourceType: 'comment' }
        ],
        text: crs( { length: 10 } ),
        data: { justSome: crs( { length: 10 } ) }
      }
    } )
    const commentId2 = await createComment( {
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: streamCommentId1, resourceType: 'comment' }
        ],
        text: crs( { length: 10 } ),
        data: { justSome: crs( { length: 10 } ) }
      }
    } )
    const replies = await getComments( {
      streamId: stream.id,
      resources: [
        { resourceId: streamCommentId1, resourceType: 'comment' },
      ],
    } )
    expect( replies.items ).to.have.lengthOf( 2 )
    expect( replies.items.map( i => i.id ) ).deep.to.equal( [ commentId1, commentId2 ] )
  } )
  it( 'Should return all the referenced resources for a comment', async () => {
    const localObjectId = await createObject( stream.id, { anotherTestObject: 1 } )
    const inputResources = [
      { resourceId: stream.id, resourceType: 'stream' },
      { resourceId: commitId1, resourceType: 'commit' },
      { resourceId: localObjectId, resourceType: 'object' },
      { resourceId: testObject2.id, resourceType: 'object' }
    ]
    const queryResources = [
      { resourceId: stream.id, resourceType: 'stream' },
      { resourceId: localObjectId, resourceType: 'object' },
    ]
    await createComment( {
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: inputResources,
        text: crs( { length: 10 } ),
        data: { justSome: crs( { length: 10 } ) }
      }
    } )
    const comments = await getComments( {
      streamId: stream.id,
      resources: queryResources
    } )
    expect( comments.items ).to.have.lengthOf( 1 )
    expect( comments.items[0].resources ).to.have.deep.members( inputResources )
  } )
  it( 'Should return the same data when querying a single comment vs a list of comments', async () => {
    const localObjectId = await createObject( stream.id, { anotherTestObject: 42 } )
    await createComment( {
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: localObjectId, resourceType: 'object' },
        ],
        text: crs( { length: 10 } ),
        data: { justSome: crs( { length: 10 } ) }
      }
    } )
    const comments = await getComments( {
      streamId: stream.id,
      resources: [
        { resourceId: stream.id, resourceType: 'stream' },
        { resourceId: localObjectId, resourceType: 'object' },
      ]
    } )
    expect( comments.items ).to.have.lengthOf( 1 )
    const [ firstComment ] = comments.items
    const comment = await getComment( firstComment.id )

    expect( comment ).deep.to.equal( firstComment )
  } )
  it( 'Should be able to edit a comment text and its context???' )
  it( 'Should not be allowed to edit a not existing comment' )
  it( 'Should be able to archive a comment', async () => {
    const commentId = await createComment( {
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
        ],
        text: crs( { length: 10 } ),
        data: { justSome: crs( { length: 10 } ) }
      }
    } )

    let comment = await getComment( commentId )
    expect( comment.archived ).to.equal( false )

    await archiveComment( { commentId } )

    comment = await getComment( commentId )
    expect( comment.archived ).to.equal( true )

    await archiveComment( { commentId, archived: false } )

    comment = await getComment( commentId )
    expect( comment.archived ).to.equal( false )
  } )
  it( 'Should not be allowed to archive a not existing comment', async () => {
    archiveComment( { commentId: 'badabumm' } )
      .then( () => { throw new Error( 'This should have been rejected' ) } )
      .catch( error => expect( error.message ).to.be.equal( 'No comment badabumm exists, cannot change its archival status' ) )
  } )
  it( 'Should not query archived comments unless asked', async () => {
    const localObjectId = await createObject( stream.id, { testObject: crs( { length: 10 } ) } )

    const commentCount = 15
    for ( let i = 0; i < commentCount; i++ ) {
      await createComment( {
        userId: user.id,
        input: {
          streamId: stream.id,
          resources: [
            { resourceId: localObjectId, resourceType: 'object' }
          ],
          text: crs( { length: 10 } ),
          data: { justSome: crs( { length: 10 } ) }
        }
      } )
    }

    const archiveCount = 3
    let comments = await getComments( {
      streamId: stream.id,
      resources: [
        { resourceId: localObjectId, resourceType: 'object' }
      ],
      limit: archiveCount
    } )
    expect( comments.totalCount ).to.be.equal( commentCount )

    await Promise.all( comments.items.map( comment => archiveComment( { commentId: comment.id } ) ) )

    comments = await getComments( {
      streamId: stream.id,
      resources: [
        { resourceId: localObjectId, resourceType: 'object' }
      ],
      limit: 100
    } )
    expect( comments.totalCount ).to.be.equal( commentCount - archiveCount )
    expect( comments.items.length ).to.be.equal( commentCount - archiveCount )

    comments = await getComments( {
      streamId: stream.id,
      resources: [
        { resourceId: localObjectId, resourceType: 'object' }
      ],
      limit: 100,
      archived: true
    } )
    expect( comments.totalCount ).to.be.equal( commentCount )
    expect( comments.items.length ).to.be.equal( commentCount )
  } )
  it( 'Should publish events to pubsub, test it by registering a subscriber' )
  it( 'Should be able to write a short novel as comment text', async () => {
    const commentId = await createComment( {
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' }
        ],
        text: aShortNovel,
        data: { justSome: crs( { length: 10 } ) }
      }
    } )

    const comment = await getComment( commentId )
    expect( comment.text ).to.equal( aShortNovel )
  } )
} )


const aShortNovel = `
In the works of Gaiman, a predominant concept is the concept of
precapitalist narrativity. Humphrey[1] suggests that we have
to choose between the structuralist paradigm of context and Derridaist reading.
But Marx uses the term ‘surrealism’ to denote the meaninglessness of
materialist society.

If one examines the structuralist paradigm of context, one is faced with a
choice: either accept substructural narrative or conclude that truth is used to
entrench class divisions, given that Lacan’s analysis of the structuralist
paradigm of context is valid. Foucault suggests the use of dialectic discourse
to analyse and challenge class. However, Bataille uses the term ‘the
constructivist paradigm of expression’ to denote the difference between sexual
identity and consciousness.

The stasis, and some would say the futility, of dialectic discourse
intrinsic to Gaiman’s Black Orchid is also evident in Sandman.
But the subject is contextualised into a surrealism that includes narrativity
as a paradox.

The primary theme of the works of Gaiman is not materialism, but
prematerialism. It could be said that the subject is interpolated into a
neopatriarchial narrative that includes language as a totality.

Dialectic discourse implies that culture is capable of deconstruction.
Therefore, Lyotard uses the term ‘the structuralist paradigm of context’ to
denote the failure of structuralist class.
2. Gaiman and surrealism

The characteristic theme of Tilton’s[2] model of the
structuralist paradigm of context is not deappropriation, as Lacan would have
it, but subdeappropriation. Baudrillard’s analysis of dialectic discourse holds
that consensus is created by the collective unconscious, but only if
consciousness is interchangeable with language. Thus, the subject is
contextualised into a structuralist paradigm of context that includes
consciousness as a reality.

Derrida uses the term ‘neomodern theory’ to denote the role of the poet as
writer. But dialectic discourse implies that the State is a legal fiction.

Baudrillard uses the term ‘the structuralist paradigm of context’ to denote
not, in fact, desituationism, but predesituationism. In a sense, the premise of
Sontagist camp holds that sexuality serves to marginalize the underprivileged.

The subject is interpolated into a dialectic discourse that includes art as
a whole. It could be said that Bataille promotes the use of the structuralist
paradigm of context to deconstruct sexism.
`
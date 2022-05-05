/* istanbul ignore file */
const expect = require('chai').expect
const crs = require('crypto-random-string')

const { beforeEachContext } = require('@/test/hooks')
const { createUser } = require('@/modules/core/services/users')
const { createStream } = require('@/modules/core/services/streams')
const { createCommitByBranchName } = require('@/modules/core/services/commits')

const { createObject } = require('@/modules/core/services/objects')
const {
  createComment,
  getComments,
  getComment,
  editComment,
  viewComment,
  createCommentReply,
  archiveComment,
  getResourceCommentCount,
  getStreamCommentCount
} = require('../services')

describe('Comments @comments', () => {
  const user = {
    name: 'The comment wizard',
    email: 'comment@wizard.ry',
    password: 'i did not like Rivendel wine :('
  }

  const otherUser = {
    name: 'Fondalf The Brey',
    email: 'totalnotfakegandalf87@mordor.com',
    password: 'what gandalf puts in his pipe stays in his pipe'
  }

  const stream = {
    name: 'Commented stream',
    description: 'Chit chats over here'
  }

  const testObject1 = {
    foo: 'bar'
  }

  const testObject2 = {
    foo: 'barbar',
    baz: 123
  }

  let commitId1, commitId2

  before(async () => {
    await beforeEachContext()

    user.id = await createUser(user)
    otherUser.id = await createUser(otherUser)

    stream.id = await createStream({ ...stream, ownerId: user.id })

    testObject1.id = await createObject(stream.id, testObject1)
    testObject2.id = await createObject(stream.id, testObject2)

    commitId1 = await createCommitByBranchName({
      streamId: stream.id,
      branchName: 'main',
      message: 'first commit',
      sourceApplication: 'tests',
      objectId: testObject1.id,
      authorId: user.id
    })
    commitId2 = await createCommitByBranchName({
      streamId: stream.id,
      branchName: 'main',
      message: 'first commit',
      sourceApplication: 'tests',
      objectId: testObject2.id,
      authorId: user.id
    })
  })

  it('Should not be allowed to comment without specifying at least one target resource', async () => {
    await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [],
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) =>
        expect(error.message).to.be.equal(
          'Must specify at least one resource as the comment target'
        )
      )
  })

  it('Should not be able to comment resources that do not belong to the input streamId', async () => {
    // Stream A belongs to user
    const streamA = { name: 'Stream A' }
    streamA.id = await createStream({ ...streamA, ownerId: user.id })
    const objA = { foo: 'bar' }
    objA.id = await createObject(streamA.id, objA)
    const commA = {}
    commA.id = await createCommitByBranchName({
      streamId: streamA.id,
      branchName: 'main',
      message: 'baz',
      objectId: objA.id,
      authorId: user.id
    })

    // Stream B belongs to otherUser
    const streamB = { name: 'Stream B' }
    streamB.id = await createStream({ ...streamB, ownerId: otherUser.id })
    const objB = { qux: 'mux' }
    objB.id = await createObject(streamB.id, objB)
    const commB = {}
    commB.id = await createCommitByBranchName({
      streamId: streamB.id,
      branchName: 'main',
      message: 'baz',
      objectId: objB.id,
      authorId: otherUser.id
    })

    // create a comment on streamA but objectB
    await createComment({
      userId: user.id,
      input: {
        streamId: streamA.id,
        resources: [{ resourceId: objB.id, resourceType: 'object' }]
      }
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) => expect(error.message).to.be.equal('Object not found'))

    // create a comment on streamA but commitB
    await createComment({
      userId: user.id,
      input: {
        streamId: streamA.id,
        resources: [{ resourceId: commB.id, resourceType: 'commit' }]
      }
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) => expect(error.message).to.be.equal('Commit not found'))

    // mixed bag of resources (A, B)
    await createComment({
      userId: user.id,
      input: {
        streamId: streamA.id,
        resources: [
          { resourceId: commA.id, resourceType: 'commit' },
          { resourceId: commB.id, resourceType: 'commit' }
        ]
      }
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) => expect(error.message).to.be.equal('Commit not found'))

    // correct this time, let's see this one not fail
    const correctCommentId = await createComment({
      userId: user.id,
      input: {
        streamId: streamA.id,
        resources: [
          { resourceId: commA.id, resourceType: 'commit' },
          { resourceId: commA.id, resourceType: 'commit' }
        ]
      }
    })

    // replies should also not be swappable
    await createCommentReply({
      authorId: user.id,
      parentCommentId: correctCommentId,
      streamId: streamB.id,
      text: 'I am a 3l1t3 hack0r; - drop tables;'
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) =>
        expect(error.message).to.be.equal(
          'Stop hacking - that comment is not part of the specified stream.'
        )
      )
  })

  it('Should return comment counts for streams, commits and objects', async () => {
    const stream = { name: 'Bean Counter' }
    stream.id = await createStream({ ...stream, ownerId: user.id })
    const obj = { foo: 'bar' }
    obj.id = await createObject(stream.id, obj)
    const commit = {}
    commit.id = await createCommitByBranchName({
      streamId: stream.id,
      branchName: 'main',
      message: 'baz',
      objectId: obj.id,
      authorId: user.id
    })

    const commCount = 10
    const commentIds = []
    for (let i = 0; i < commCount; i++) {
      // creates 1 * commCount comments linked to commit and object
      commentIds.push(
        await createComment({
          userId: user.id,
          input: {
            text: 'bar',
            streamId: stream.id,
            resources: [
              { resourceId: commit.id, resourceType: 'commit' },
              { resourceId: obj.id, resourceType: 'object' }
            ]
          }
        })
      )
      // creates 1 * commCount comments linked to commit only
      commentIds.push(
        await createComment({
          userId: user.id,
          input: {
            text: 'baz',
            streamId: stream.id,
            resources: [{ resourceId: commit.id, resourceType: 'commit' }]
          }
        })
      )
      // creates 1 * commCount comments linked to object only
      commentIds.push(
        await createComment({
          userId: user.id,
          input: {
            text: 'qux',
            streamId: stream.id,
            resources: [{ resourceId: obj.id, resourceType: 'object' }]
          }
        })
      )
    }

    // create some replies to foil the counts
    await createCommentReply({
      authorId: user.id,
      parentCommentId: commentIds[0],
      streamId: stream.id,
      input: { text: crs({ length: 10 }) }
    })
    await createCommentReply({
      authorId: user.id,
      parentCommentId: commentIds[1],
      streamId: stream.id,
      input: { text: crs({ length: 10 }) }
    })
    await createCommentReply({
      authorId: user.id,
      parentCommentId: commentIds[2],
      streamId: stream.id,
      input: { text: crs({ length: 10 }) }
    })

    // we archive one of the object only comments for fun and profit
    await archiveComment({
      commentId: commentIds[commentIds.length - 1],
      userId: user.id,
      streamId: stream.id,
      archived: true
    })

    const count = await getStreamCommentCount({ streamId: stream.id }) // should be 30
    expect(count).to.equal(commCount * 3 - 1)

    const objCount = await getResourceCommentCount({ resourceId: obj.id })
    expect(objCount).to.equal(commCount * 2 - 1)

    const commitCount = await getResourceCommentCount({ resourceId: commit.id })
    expect(commitCount).to.equal(commCount * 2)

    const streamOther = { name: 'Bean Counter' }
    streamOther.id = await createStream({ ...streamOther, ownerId: user.id })
    const objOther = { 'are you bored': 'yes' }
    objOther.id = await createObject(streamOther.id, objOther)
    const commitOther = {}
    commitOther.id = await createCommitByBranchName({
      streamId: streamOther.id,
      branchName: 'main',
      message: 'baz',
      objectId: objOther.id,
      authorId: user.id
    })

    const countOther = await getStreamCommentCount({ streamId: streamOther.id })
    expect(countOther).to.equal(0)

    const objCountOther = await getResourceCommentCount({
      streamId: streamOther.id,
      resourceId: objOther.id
    })
    expect(objCountOther).to.equal(0)

    const commitCountOther = await getResourceCommentCount({
      streamId: streamOther.id,
      resourceId: commitOther.id
    })
    expect(commitCountOther).to.equal(0)
  })

  it('Should create viewedAt entries for comments', async () => {
    const id = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: commitId1, resourceType: 'commit' }],
        text: 'https://tenor.com/view/gandalf-smoking-gif-21189890', // possibly NSFW
        data: {
          someMore:
            'https://tenor.com/view/gandalf-old-man-naked-take-robe-off-funny-gif-17224126'
        } // possibly NSFW
      }
    })

    // ppl creating comments get to view them too
    const comment = await getComment({ id, userId: user.id })
    expect(comment).to.haveOwnProperty('viewedAt')

    const commentNoUser = await getComment({ id })
    expect(commentNoUser).to.not.haveOwnProperty('viewedAt')

    const commentOtherUser = await getComment({ id, userId: otherUser.id })
    expect(commentOtherUser.viewedAt).to.be.null

    await viewComment({ userId: user.id, commentId: id })

    const viewedCommentOtherUser = await getComment({ id, userId: otherUser.id })
    expect(viewedCommentOtherUser).to.haveOwnProperty('viewedAt')
  })

  it('Should not be allowed to comment targeting multiple streams as a resource', async () => {
    await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: commitId1, resourceType: 'commit' },
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: testObject1.id, resourceType: 'object' }
        ],
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) =>
        expect(error.message).to.be.equal(
          'Commenting on multiple streams is not supported'
        )
      )
  })

  it('Should not be allowed to comment on non existing resources', async () => {
    const nonExistentResources = [
      {
        streamId: 'this doesnt exist dummy',
        resources: [{ resourceId: 'this doesnt exist dummy', resourceType: 'stream' }],
        text: null,
        data: null
      },
      {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: 'this doesnt exist dummy', resourceType: 'commit' }
        ],
        text: null,
        data: null
      },
      {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: 'this doesnt exist dummy', resourceType: 'object' }
        ],
        text: null,
        data: null
      },
      {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: 'this doesnt exist dummy', resourceType: 'comment' }
        ],
        text: null,
        data: null
      }
    ]
    for (const input of nonExistentResources) {
      await createComment({ userId: user.id, input })
        .then(() => {
          throw new Error('This should have been rejected')
        })
        .catch((error) => expect(error.message).to.not.be.null)
    }
  })

  it('Should not be allowed to comment on an non supported resource type', async () => {
    await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: 'jubbjabb', resourceType: 'flux capacitor' }
        ],
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) => expect(error.message).to.not.be.null)
  })

  it('Should be able to comment on valid resources in any permutation', async () => {
    const resourceCombinations = [
      [{ resourceId: stream.id, resourceType: 'stream' }],
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
    for (const resources of resourceCombinations) {
      const commentId = await createComment({
        userId: user.id,
        input: {
          streamId: stream.id,
          resources,
          text: crs({ length: 10 }),
          data: { justSome: crs({ length: 10 }) }
        }
      })
      expect(commentId).to.exist
    }
  })

  it('Should not return the same comment multiple times for multi resource comments', async () => {
    const localObjectId = await createObject(stream.id, { testObject: 1 })

    const commentCount = 3
    for (let i = 0; i < commentCount; i++) {
      await createComment({
        userId: user.id,
        input: {
          streamId: stream.id,
          resources: [
            { resourceId: stream.id, resourceType: 'stream' },
            { resourceId: commitId1, resourceType: 'commit' },
            { resourceId: localObjectId, resourceType: 'object' }
          ],
          text: crs({ length: 10 }),
          data: { justSome: 'distinct test' + crs({ length: 10 }) }
        }
      })
    }

    const comments = await getComments({
      streamId: stream.id,
      resources: [
        { resourceId: commitId1, resourceType: 'commit' },
        { resourceId: localObjectId, resourceType: 'object' }
      ]
    })

    const ids = comments.items.map((c) => c.id)
    const set = new Set(ids)
    expect(set.size).to.equal(ids.length)

    // Note: since we switched to an "or" clause, this does not apply anymore.
    // expect( comments.items ).to.have.lengthOf( commentCount )
  })

  it('should not be allowed to hop streams with a comment id', () => {
    // Note: fixed in resolver
  })

  it('Should handle cursor and limit for queries', async () => {
    const localObjectId = await createObject(stream.id, {
      testObject: 'something completely different'
    })

    const createdComments = []
    const commentCount = 10
    for (let i = 0; i < commentCount; i++) {
      createdComments.push(
        await createComment({
          userId: user.id,
          input: {
            streamId: stream.id,
            resources: [
              { resourceId: stream.id, resourceType: 'stream' },
              { resourceId: commitId1, resourceType: 'commit' },
              { resourceId: localObjectId, resourceType: 'object' }
            ],
            text: crs({ length: 10 }),
            data: { justSome: crs({ length: 10 }) }
          }
        })
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    let comments = await getComments({
      streamId: stream.id,
      resources: [
        { resourceId: commitId1, resourceType: 'commit' },
        { resourceId: localObjectId, resourceType: 'object' }
      ],
      limit: 2
    })
    expect(comments.items).to.have.lengthOf(2)
    expect(createdComments.reverse().slice(0, 2)).deep.to.equal(
      comments.items.map((c) => c.id)
    ) // note: reversing as default order is newest first now

    const cursor = comments.items[1].createdAt
    comments = await getComments({
      streamId: stream.id,
      resources: [
        { resourceId: commitId1, resourceType: 'commit' },
        { resourceId: localObjectId, resourceType: 'object' }
      ],
      limit: 2,
      cursor
    })
    expect(comments.items).to.have.lengthOf(2)
    expect(createdComments.slice(2, 4)).deep.to.equal(comments.items.map((c) => c.id))
  })

  it('Should properly return replies for a comment', async () => {
    const streamCommentId1 = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: stream.id, resourceType: 'stream' }],
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })

    const commentId1 = await createCommentReply({
      authorId: user.id,
      parentCommentId: streamCommentId1,
      streamId: stream.id,
      input: {
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })

    const commentId2 = await createCommentReply({
      authorId: user.id,
      parentCommentId: streamCommentId1,
      streamId: stream.id,
      input: {
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })
    const replies = await getComments({
      streamId: stream.id,
      replies: true,
      resources: [{ resourceId: streamCommentId1, resourceType: 'comment' }]
    })
    expect(replies.items).to.have.lengthOf(2)
    expect(replies.items.reverse().map((i) => i.id)).deep.to.equal([
      commentId1,
      commentId2
    ])
  })

  it('Should return all the referenced resources for a comment', async () => {
    const localObjectId = await createObject(stream.id, { anotherTestObject: 1 })
    const inputResources = [
      { resourceId: stream.id, resourceType: 'stream' },
      { resourceId: commitId1, resourceType: 'commit' },
      { resourceId: localObjectId, resourceType: 'object' },
      { resourceId: testObject2.id, resourceType: 'object' }
    ]
    const queryResources = [
      { resourceId: stream.id, resourceType: 'stream' },
      { resourceId: localObjectId, resourceType: 'object' }
    ]
    await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: inputResources,
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })

    const comments = await getComments({
      streamId: stream.id,
      resources: queryResources
    })
    // expect( comments.items ).to.have.lengthOf( 1 ) // not applicable anymore, as we're "OR"-ing
    inputResources.sort() // order is not ensured
    expect(comments.items[0].resources).to.have.deep.members(inputResources)
  })

  it('Should return the same data when querying a single comment vs a list of comments', async () => {
    const localObjectId = await createObject(stream.id, { anotherTestObject: 42 })
    await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: localObjectId, resourceType: 'object' }
        ],
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })
    const comments = await getComments({
      streamId: stream.id,
      resources: [{ resourceId: localObjectId, resourceType: 'object' }]
    })
    expect(comments.items).to.have.lengthOf(1)
    const [firstComment] = comments.items
    const comment = await getComment({ id: firstComment.id })

    // the getComments query brings along some extra garbage i'm lazy to clean up
    delete firstComment.total_count
    delete firstComment.resourceType
    delete firstComment.resourceId
    delete firstComment.commentId

    expect(comment).deep.to.equal(firstComment)
  })

  it('Should be able to edit a comment text', async () => {
    const localObjectId = await createObject(stream.id, {
      anotherTestObject: crs({ length: 10 })
    })
    const commentId = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: localObjectId, resourceType: 'object' }
        ],
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })

    const properText = 'now thats what im talking about'
    await editComment({ userId: user.id, input: { id: commentId, text: properText } })
    const comment = await getComment({ id: commentId })
    expect(comment.text).to.be.equal(properText)
  })

  it('Should not be allowed to edit a not existing comment', async () => {
    await editComment({
      userId: user.id,
      input: { id: 'this is not going to be found' }
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) => expect(error.message).to.be.equal("The comment doesn't exist"))
  })

  it('Should not be allowed to edit a comment of another user', async () => {
    const localObjectId = await createObject(stream.id, {
      anotherTestObject: crs({ length: 10 })
    })
    const commentId = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: 'stream' },
          { resourceId: localObjectId, resourceType: 'object' }
        ],
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })

    await editComment({
      userId: otherUser.id,
      input: { id: commentId, text: 'properText' }
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) =>
        expect(error.message).to.be.equal("You cannot edit someone else's comments")
      )
  })

  it('Should be able to toggle reactions for a comment')

  it('Should be able to archive a comment', async () => {
    const commentId = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: stream.id, resourceType: 'stream' }],
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })

    let comment = await getComment({ id: commentId })
    expect(comment.archived).to.equal(false)

    await archiveComment({ streamId: stream.id, commentId, userId: user.id })

    comment = await getComment({ id: commentId })
    expect(comment.archived).to.equal(true)

    await archiveComment({
      streamId: stream.id,
      commentId,
      userId: user.id,
      archived: false
    })

    comment = await getComment({ id: commentId })
    expect(comment.archived).to.equal(false)
  })

  it('Should not be allowed to archive a not existing comment', async () => {
    await archiveComment({
      commentId: 'badabumm',
      streamId: stream.id,
      userId: user.id
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) =>
        expect(error.message).to.be.equal(
          'No comment badabumm exists, cannot change its archival status'
        )
      )
  })

  it("Should be forbidden to archive someone else's comment, unless the person is a stream admin", async () => {
    const commentId = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: stream.id, resourceType: 'stream' }],
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })

    await archiveComment({ commentId, streamId: stream.id, userId: otherUser.id })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) =>
        expect(error.message).to.be.equal(
          "You don't have permission to archive the comment"
        )
      )

    const otherUsersCommentId = await createComment({
      userId: otherUser.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: stream.id, resourceType: 'stream' }],
        text: crs({ length: 10 }),
        data: { justSome: crs({ length: 10 }) }
      }
    })
    const archiveResult = await archiveComment({
      commentId: otherUsersCommentId,
      userId: user.id,
      streamId: stream.id
    })
    expect(archiveResult).to.be.true
  })

  it('Should not query archived comments unless asked', async () => {
    const localObjectId = await createObject(stream.id, {
      testObject: crs({ length: 10 })
    })

    const commentCount = 15
    for (let i = 0; i < commentCount; i++) {
      await createComment({
        userId: user.id,
        input: {
          streamId: stream.id,
          resources: [{ resourceId: localObjectId, resourceType: 'object' }],
          text: crs({ length: 10 }),
          data: { justSome: crs({ length: 10 }) }
        }
      })
    }

    const archiveCount = 3
    let comments = await getComments({
      streamId: stream.id,
      resources: [{ resourceId: localObjectId, resourceType: 'object' }],
      limit: archiveCount
    })
    expect(comments.totalCount).to.be.equal(commentCount)

    await Promise.all(
      comments.items.map((comment) =>
        archiveComment({ commentId: comment.id, streamId: stream.id, userId: user.id })
      )
    )

    comments = await getComments({
      streamId: stream.id,
      resources: [{ resourceId: localObjectId, resourceType: 'object' }],
      limit: 100
    })
    expect(comments.totalCount).to.be.equal(commentCount - archiveCount)
    expect(comments.items.length).to.be.equal(commentCount - archiveCount)

    comments = await getComments({
      streamId: stream.id,
      resources: [{ resourceId: localObjectId, resourceType: 'object' }],
      limit: 100,
      archived: true
    })
    expect(comments.totalCount).to.be.equal(archiveCount)
    expect(comments.items.length).to.be.equal(archiveCount)
  })

  it('Should be able to write a short novel as comment text', async () => {
    const commentId = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: stream.id, resourceType: 'stream' }],
        text: aShortNovel,
        data: { justSome: crs({ length: 10 }) }
      }
    })

    const comment = await getComment({ id: commentId })
    expect(comment.text).to.equal(aShortNovel)
  })
})

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

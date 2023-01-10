const expect = require('chai').expect

const crs = require('crypto-random-string')
const { buildApolloServer } = require('@/app')
const { addLoadersToCtx } = require('@/modules/shared/middleware')
const { beforeEachContext } = require('@/test/hooks')
const { Roles, AllScopes } = require('@/modules/core/helpers/mainConstants')
const {
  grantPermissionsStream,
  updateStream
} = require('@/modules/core/services/streams')
const { createUser } = require('@/modules/core/services/users')
const { gql } = require('apollo-server-express')
const { createStream } = require('@/modules/core/services/streams')
const { createObject } = require('@/modules/core/services/objects')
const { createComment } = require('@/modules/comments/services')
const { createCommitByBranchName } = require('@/modules/core/services/commits')
const {
  convertBasicStringToDocument
} = require('@/modules/core/services/richTextEditorService')

function buildCommentInputFromString(textString) {
  return convertBasicStringToDocument(textString)
}

const testForbiddenResponse = (result) => {
  expect(result.errors, 'This should have failed').to.exist
  expect(result.errors.length).to.be.above(0)
  expect(result.errors[0].extensions.code).to.equal('FORBIDDEN')
}

const testResult = (shouldSucceed, result, successTests) => {
  if (shouldSucceed) {
    expect(result.errors, 'This should not have failed').to.not.exist
    successTests(result)
  } else {
    testForbiddenResponse(result)
  }
}

const writeComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await apollo.executeOperation({
    query: gql`
      mutation ($input: CommentCreateInput!) {
        commentCreate(input: $input)
      }
    `,
    variables: {
      input: {
        streamId: resources.streamId,
        text: buildCommentInputFromString('foo'),
        blobIds: [],
        data: {},
        resources: [{ resourceId: resources.streamId, resourceType: 'stream' }]
      }
    }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentCreate).to.be.string
    expect(res.data.commentCreate.length).to.equal(10)
  })
}

const broadcastViewerActivity = async ({ apollo, resources, shouldSucceed }) => {
  const res = await apollo.executeOperation({
    query: gql`
      mutation ($streamId: String!, $resourceId: String!, $data: JSONObject) {
        userViewerActivityBroadcast(
          streamId: $streamId
          resourceId: $resourceId
          data: $data
        )
      }
    `,
    variables: {
      streamId: resources.streamId,
      data: {},
      resourceId: resources.objectId
    }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.userViewerActivityBroadcast).to.be.true
  })
}

const broadcastCommentActivity = async ({ apollo, resources, shouldSucceed }) => {
  const res = await apollo.executeOperation({
    query: gql`
      mutation ($streamId: String!, $commentId: String!, $data: JSONObject) {
        userCommentThreadActivityBroadcast(
          streamId: $streamId
          commentId: $commentId
          data: $data
        )
      }
    `,
    variables: {
      streamId: resources.streamId,
      data: {},
      commentId: resources.commentId
    }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.userCommentThreadActivityBroadcast).to.be.true
  })
}

const viewAComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await apollo.executeOperation({
    query: gql`
      mutation ($streamId: String!, $commentId: String!) {
        commentView(streamId: $streamId, commentId: $commentId)
      }
    `,
    variables: {
      streamId: resources.streamId,
      commentId: resources.commentId
    }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentView).to.be.true
  })
}

const archiveMyComment = async ({ apollo, resources, shouldSucceed }) => {
  const context = await apollo.context()
  const { id: commentId } = await createComment({
    userId: context.userId,
    input: {
      streamId: resources.streamId,
      text: buildCommentInputFromString('i wrote this myself'),
      blobIds: [],
      data: {},
      resources: [
        { resourceId: resources.streamId, resourceType: 'stream' },
        { resourceId: resources.objectId, resourceType: 'object' }
      ]
    }
  })
  const res = await apollo.executeOperation({
    query: gql`
      mutation ($streamId: String!, $commentId: String!) {
        commentArchive(streamId: $streamId, commentId: $commentId)
      }
    `,
    variables: { streamId: resources.streamId, commentId }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentArchive).to.be.true
  })
}

const archiveOthersComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await apollo.executeOperation({
    query: gql`
      mutation ($streamId: String!, $commentId: String!) {
        commentArchive(streamId: $streamId, commentId: $commentId)
      }
    `,
    variables: {
      streamId: resources.streamId,
      commentId: resources.commentId
    }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentArchive).to.be.true
  })
}

const editMyComment = async ({ apollo, resources, shouldSucceed }) => {
  const context = await apollo.context()
  const { id: commentId } = await createComment({
    userId: context.userId,
    input: {
      streamId: resources.streamId,
      text: buildCommentInputFromString('i wrote this myself'),
      blobIds: [],
      data: {},
      resources: [
        { resourceId: resources.streamId, resourceType: 'stream' },
        { resourceId: resources.objectId, resourceType: 'object' }
      ]
    }
  })
  const res = await apollo.executeOperation({
    query: gql`
      mutation ($input: CommentEditInput!) {
        commentEdit(input: $input)
      }
    `,
    variables: {
      input: {
        streamId: resources.streamId,
        id: commentId,
        text: buildCommentInputFromString('im going to overwrite myself'),
        blobIds: []
      }
    }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentEdit).to.be.true
  })
}

const editOthersComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await apollo.executeOperation({
    query: gql`
      mutation ($input: CommentEditInput!) {
        commentEdit(input: $input)
      }
    `,
    variables: {
      input: {
        streamId: resources.streamId,
        id: resources.commentId,
        text: buildCommentInputFromString(
          'what you wrote is dumb, here, let me fix it for you'
        ),
        blobIds: []
      }
    }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentEdit).to.be.true
  })
}

const replyToAComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await apollo.executeOperation({
    query: gql`
      mutation ($input: ReplyCreateInput!) {
        commentReply(input: $input)
      }
    `,
    variables: {
      input: {
        streamId: resources.streamId,
        parentComment: resources.commentId,
        text: buildCommentInputFromString(
          'what you wrote is dump, here, let me fix it for you'
        ),
        blobIds: [],
        data: {}
      }
    }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentReply).to.be.string
    expect(res.data.commentReply.length).to.equal(10)
  })
}

const queryComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await apollo.executeOperation({
    query: gql`
      query ($id: String!, $streamId: String!) {
        comment(id: $id, streamId: $streamId) {
          id
          replies {
            totalCount
            items {
              id
              text {
                doc
              }
            }
          }
        }
      }
    `,
    variables: {
      id: resources.commentId,
      streamId: resources.streamId
    }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.comment.id).to.exist
    expect(res.data.comment.id).to.equal(resources.commentId)
  })
}
const queryComments = async ({ apollo, resources, shouldSucceed }) => {
  const object = {
    foo: 123,
    bar: crs({ length: 5 })
  }

  const objectId = await createObject(resources.streamId, object)

  const numberOfComments = 3
  const commentIds = await Promise.all(
    [...Array(numberOfComments).keys()].map((key) =>
      createComment({
        userId: resources.testActorId,
        input: {
          streamId: resources.streamId,
          text: buildCommentInputFromString(`${key}`),
          blobIds: [],
          data: {},
          resources: [{ resourceId: objectId, resourceType: 'object' }]
        }
      }).then((c) => c.id)
    )
  )

  const res = await apollo.executeOperation({
    query: gql`
      query ($streamId: String!, $resources: [ResourceIdentifierInput]) {
        comments(streamId: $streamId, resources: $resources) {
          totalCount
          items {
            id
            text {
              doc
            }
          }
        }
      }
    `,
    variables: {
      streamId: resources.streamId,
      resources: [
        // i expected this to work as intersection, but it works as union
        { resourceId: objectId, resourceType: 'object' }
      ]
    }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.comments.totalCount).to.be.equal(numberOfComments)
    expect(res.data.comments.items.map((i) => i.id)).to.be.equalInAnyOrder(commentIds)
  })
}

const queryStreamCommentCount = async ({ apollo, resources, shouldSucceed }) => {
  await createComment({
    userId: resources.testActorId,
    input: {
      streamId: resources.streamId,
      text: buildCommentInputFromString('im expecting some replies here'),
      blobIds: [],
      data: {},
      resources: [{ resourceId: resources.streamId, resourceType: 'stream' }]
    }
  })

  const res = await apollo.executeOperation({
    query: gql`
      query ($id: String!) {
        stream(id: $id) {
          id
          commentCount
        }
      }
    `,
    variables: { id: resources.streamId }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.stream.commentCount).to.be.greaterThanOrEqual(1)
  })
}

const queryObjectCommentCount = async ({ apollo, resources, shouldSucceed }) => {
  const objectId = await createObject(resources.streamId, {
    foo: 'bar',
    noise: crs({ length: 5 })
  })
  await createComment({
    userId: resources.testActorId,
    input: {
      streamId: resources.streamId,
      text: buildCommentInputFromString('im expecting some replies here'),
      blobIds: [],
      data: {},
      resources: [{ resourceId: objectId, resourceType: 'object' }]
    }
  })

  const res = await apollo.executeOperation({
    query: gql`
      query ($id: String!, $objectId: String!) {
        stream(id: $id) {
          object(id: $objectId) {
            commentCount
          }
        }
      }
    `,
    variables: { id: resources.streamId, objectId }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.stream.object.commentCount).to.equal(1)
  })
}

const queryCommitCommentCount = async ({ apollo, resources, shouldSucceed }) => {
  const objectId = await createObject(resources.streamId, {
    foo: 'bar',
    notSignal: crs({ length: 10 })
  })
  const commitId = await createCommitByBranchName({
    streamId: resources.streamId,
    branchName: 'main',
    objectId,
    authorId: resources.testActorId,
    message: 'bumm'
  })
  await createComment({
    userId: resources.testActorId,
    input: {
      streamId: resources.streamId,
      text: buildCommentInputFromString('im expecting some replies here'),
      blobIds: [],
      data: {},
      resources: [{ resourceId: commitId, resourceType: 'commit' }]
    }
  })

  const res = await apollo.executeOperation({
    query: gql`
      query ($id: String!, $commitId: String!) {
        stream(id: $id) {
          commit(id: $commitId) {
            commentCount
          }
        }
      }
    `,
    variables: { id: resources.streamId, commitId }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.stream.commit.commentCount).to.equal(1)
  })
}

const queryCommitCollectionCommentCount = async ({
  apollo,
  resources,
  shouldSucceed
}) => {
  const objectId = await createObject(resources.streamId, {
    foo: 'bar',
    almostMakesSense: crs({ length: 10 })
  })
  const commitId = await createCommitByBranchName({
    streamId: resources.streamId,
    branchName: 'main',
    objectId,
    authorId: resources.testActorId,
    message: 'bumm'
  })
  await createComment({
    userId: resources.testActorId,
    input: {
      streamId: resources.streamId,
      text: buildCommentInputFromString('im expecting some replies here'),
      blobIds: [],
      data: {},
      resources: [{ resourceId: commitId, resourceType: 'commit' }]
    }
  })

  const res = await apollo.executeOperation({
    query: gql`
      query ($id: String!) {
        otherUser(id: $id) {
          commits {
            items {
              commentCount
            }
          }
        }
      }
    `,
    variables: { id: resources.testActorId }
  })
  testResult(shouldSucceed, res, (res) => {
    res.data.otherUser.commits.items
      .map((i) => i.commentCount)
      .map((commentCount) => {
        expect(commentCount).to.be.greaterThanOrEqual(1)
      })
  })
}

// eslint-disable-next-line no-unused-vars
const actions = ['queryCommitCommentCount', 'queryCommitCollectionCommentCount']

describe('Graphql @comments', () => {
  // this user will be admin by default
  // it will be used to create all resources, that the other actors can
  // be tested against
  const myTestActor = {
    name: 'Gergo Jedlicska',
    email: 'gergo@jedlicska.com',
    password: 'sn3aky-1337-b1m'
  }

  const chadTheEngineer = {
    name: 'Chad the Engineer',
    email: 'chad@engineering.acme',
    password: 'tryingNotToBeACadMonkey',
    role: Roles.Server.User
  }

  const archived = {
    name: 'The Balrog of Morgoth',
    email: 'durinsbane@moria.bridge',
    role: Roles.Server.ArchivedUser
  }

  const ownedStream = {
    name: 'stream owner',
    isPublic: false,
    role: Roles.Stream.Owner
  }

  const contributorStream = {
    name: 'contributions are welcome',
    isPublic: false,
    role: Roles.Stream.Contributor
  }

  const reviewerStream = {
    name: 'no work, just talk',
    isPublic: false,
    role: Roles.Stream.Reviewer
  }

  const noAccessStream = {
    name: 'aint nobody canna cross it',
    isPublic: false,
    role: null
  }

  const publicStream = {
    name: 'come take a look',
    isPublic: true,
    role: null
  }

  const publicStreamWithPublicComments = {
    name: 'the gossip protocol',
    isPublic: true,
    role: null
  }

  const testData = [
    {
      user: chadTheEngineer,
      streamData: [
        {
          stream: ownedStream,
          cases: [
            [writeComment, true],
            [broadcastViewerActivity, true],
            [broadcastCommentActivity, true],
            [viewAComment, true],
            [archiveMyComment, true],
            [archiveOthersComment, true],
            [editMyComment, true],
            [editOthersComment, true],
            [replyToAComment, true],
            [queryComment, true],
            [queryComments, true],
            [queryStreamCommentCount, true],
            [queryObjectCommentCount, true],
            [queryCommitCommentCount, true],
            [queryCommitCollectionCommentCount, true]
          ]
        },
        {
          stream: contributorStream,
          cases: [
            [writeComment, true],
            [broadcastViewerActivity, true],
            [broadcastCommentActivity, true],
            [viewAComment, true],
            [archiveMyComment, true],
            [archiveOthersComment, false],
            [editMyComment, true],
            [editOthersComment, true],
            [replyToAComment, true],
            [queryComment, true],
            [queryComments, true],
            [queryStreamCommentCount, true],
            [queryObjectCommentCount, true],
            [queryCommitCommentCount, true],
            [queryCommitCollectionCommentCount, true]
          ]
        },
        {
          stream: reviewerStream,
          cases: [
            [writeComment, true],
            [broadcastViewerActivity, true],
            [broadcastCommentActivity, true],
            [viewAComment, true],
            [archiveMyComment, true],
            [archiveOthersComment, false],
            [editMyComment, true],
            [editOthersComment, true],
            [replyToAComment, true],
            [queryComment, true],
            [queryComments, true],
            [queryStreamCommentCount, true],
            [queryObjectCommentCount, true],
            [queryCommitCommentCount, true],
            [queryCommitCollectionCommentCount, true]
          ]
        },
        {
          stream: noAccessStream,
          cases: [
            [writeComment, false],
            [broadcastViewerActivity, false],
            [broadcastCommentActivity, false],
            [viewAComment, false],
            [archiveOthersComment, false],
            [editOthersComment, false],
            [replyToAComment, false],
            [queryComment, false],
            [queryComments, false],
            [queryStreamCommentCount, false],
            [queryObjectCommentCount, false],
            [queryCommitCommentCount, false],
            [queryCommitCollectionCommentCount, true]
          ]
        },
        {
          stream: publicStream,
          cases: [
            [writeComment, false],
            [broadcastViewerActivity, true],
            [broadcastCommentActivity, false],
            [viewAComment, true],
            [archiveMyComment, false],
            [archiveOthersComment, false],
            [editMyComment, false],
            [editOthersComment, false],
            [replyToAComment, false],
            [queryComment, true],
            [queryComments, true],
            [queryStreamCommentCount, true],
            [queryObjectCommentCount, true],
            [queryCommitCommentCount, true],
            [queryCommitCollectionCommentCount, true]
          ]
        },
        {
          stream: publicStreamWithPublicComments,
          cases: [
            [writeComment, true],
            [broadcastViewerActivity, true],
            [broadcastCommentActivity, true],
            [viewAComment, true],
            [archiveMyComment, true],
            [archiveOthersComment, false],
            [editMyComment, true],
            [editOthersComment, false],
            [replyToAComment, true],
            [queryComment, true],
            [queryComments, true],
            [queryStreamCommentCount, true],
            [queryObjectCommentCount, true],
            [queryCommitCommentCount, true],
            [queryCommitCollectionCommentCount, true]
          ]
        }
      ]
    },
    {
      user: archived,
      streamData: [
        {
          stream: ownedStream,
          cases: [
            [writeComment, false],
            [broadcastViewerActivity, false],
            [broadcastCommentActivity, false],
            [viewAComment, false],
            [archiveOthersComment, false],
            [editOthersComment, false],
            [replyToAComment, false],
            [queryComment, false],
            [queryComments, false],
            [queryStreamCommentCount, false],
            [queryObjectCommentCount, false],
            [queryCommitCommentCount, false],
            [queryCommitCollectionCommentCount, false]
          ]
        },
        {
          stream: publicStreamWithPublicComments,
          cases: [
            [writeComment, false],
            [broadcastViewerActivity, false],
            [broadcastCommentActivity, false],
            [viewAComment, false],
            [archiveOthersComment, false],
            [editOthersComment, false],
            [replyToAComment, false],
            [queryComment, false],
            [queryComments, false],
            [queryStreamCommentCount, false],
            [queryObjectCommentCount, false],
            [queryCommitCommentCount, false],
            [queryCommitCollectionCommentCount, false]
          ]
        }
      ]
    },
    {
      user: null,
      streamData: [
        {
          stream: ownedStream,
          cases: [
            [writeComment, false],
            [broadcastViewerActivity, false],
            [broadcastCommentActivity, false],
            [viewAComment, false],
            [archiveOthersComment, false],
            [editOthersComment, false],
            [replyToAComment, false],
            [queryComment, false],
            [queryComments, false],
            [queryStreamCommentCount, false],
            [queryObjectCommentCount, false],
            [queryCommitCommentCount, false],
            [queryCommitCollectionCommentCount, false]
          ]
        },
        {
          stream: publicStreamWithPublicComments,
          cases: [
            [writeComment, false],
            [broadcastViewerActivity, false],
            [broadcastCommentActivity, false],
            [viewAComment, false],
            [archiveOthersComment, false],
            [editOthersComment, false],
            [replyToAComment, false],
            [queryComment, true],
            [queryComments, true],
            [queryStreamCommentCount, true],
            [queryObjectCommentCount, true],
            [queryCommitCommentCount, true],
            [queryCommitCollectionCommentCount, false]
          ]
        },
        {
          stream: publicStream,
          cases: [
            [writeComment, false],
            [broadcastViewerActivity, false],
            [broadcastCommentActivity, false],
            [viewAComment, false],
            [archiveOthersComment, false],
            [editOthersComment, false],
            [replyToAComment, false],
            [queryComment, true],
            [queryComments, true],
            [queryStreamCommentCount, true],
            [queryObjectCommentCount, true],
            [queryCommitCommentCount, true],
            [queryCommitCollectionCommentCount, false]
          ]
        }
      ]
    }
  ]

  before(async () => {
    await beforeEachContext()
    myTestActor.id = await createUser(myTestActor)
    await Promise.all(
      [chadTheEngineer, archived].map((user) =>
        createUser({ name: user.name, email: user.email, password: user.password })
          .then((id) => (user.id = id))
          .catch((err) => {
            throw err
          })
      )
    )

    ownedStream.id = await createStream({ ...ownedStream, ownerId: myTestActor.id })
    contributorStream.id = await createStream({
      ...contributorStream,
      ownerId: myTestActor.id
    })
    reviewerStream.id = await createStream({
      ...reviewerStream,
      ownerId: myTestActor.id
    })
    noAccessStream.id = await createStream({
      ...noAccessStream,
      ownerId: myTestActor.id
    })
    publicStream.id = await createStream({
      ...publicStream,
      ownerId: myTestActor.id
    })
    publicStreamWithPublicComments.id = await createStream({
      ...publicStreamWithPublicComments,
      ownerId: myTestActor.id
    })
    await updateStream({
      ...publicStreamWithPublicComments,
      id: publicStreamWithPublicComments.id,
      allowPublicComments: true
    })
  })

  testData.forEach((userContext) => {
    const user = userContext.user

    describe(`I, ${user?.name ?? 'Anonymous'} as a ${
      user?.role ?? 'shadow:lurker'
    }`, () => {
      userContext.streamData.forEach((streamContext) => {
        const stream = streamContext.stream
        let resources
        let apollo

        before(async () => {
          apollo = await buildApolloServer({
            context: () =>
              addLoadersToCtx({
                auth: true,
                userId: user?.id,
                role: user?.role,
                token: 'asd',
                scopes: AllScopes
              })
          })

          if (user && stream.role) {
            await grantPermissionsStream({
              streamId: stream.id,
              userId: user.id,
              role: stream.role
            })
          }

          const objectId = await createObject(stream.id, { test: 'object' })

          const { id: commentId } = await createComment({
            userId: myTestActor.id,
            input: {
              streamId: stream.id,
              text: buildCommentInputFromString('foo'),
              blobIds: [],
              data: {},
              resources: [{ resourceId: stream.id, resourceType: 'stream' }]
            }
          })

          resources = {
            objectId,
            commentId,
            streamId: stream.id,
            testActorId: myTestActor.id
          }
        })

        describe(`testing ${streamContext.cases.length} cases of acting on ${
          stream.name
        } stream where I'm a ${
          user && stream.role ? stream.role : 'trouble:maker'
        }`, () => {
          streamContext.cases.forEach(([testCase, shouldSucceed]) => {
            it(`${shouldSucceed ? 'can' : 'am not allowed to'} ${
              testCase.name
            }`, async () => {
              await testCase({ apollo, streamId: stream.id, resources, shouldSucceed })
            })
          })
        })
      })
    })
  })
})

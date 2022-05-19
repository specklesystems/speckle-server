const expect = require('chai').expect

const { buildApolloServer } = require('@/app')
const { addLoadersToCtx } = require('@/modules/shared')
const { beforeEachContext } = require('@/test/hooks')
const { Roles, AllScopes } = require('@/modules/core/helpers/mainConstants')
const { grantPermissionsStream } = require('@/modules/core/services/streams')
const { createUser } = require('@/modules/core/services/users')
const { gql } = require('apollo-server-express')
const { createStream } = require('@/modules/core/services/streams')
const { createObject } = require('@/modules/core/services/objects')
const { createComment, createCommentReply } = require('@/modules/comments/services')

describe('Subscriptions @comments', () => {
  // the idea here, is to use a pubsub.asyncIterator and count the expected events
  it('Should publish events to pubsub, test it by registering a subscriber')
})

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
        text: 'foo',
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
  const commentResult = await apollo.executeOperation({
    query: gql`
      mutation ($input: CommentCreateInput!) {
        commentCreate(input: $input)
      }
    `,
    variables: {
      input: {
        streamId: resources.streamId,
        text: 'i wrote this myself',
        data: {},
        resources: [
          { resourceId: resources.streamId, resourceType: 'stream' },
          { resourceId: resources.objectId, resourceType: 'object' }
        ]
      }
    }
  })
  const res = await apollo.executeOperation({
    query: gql`
      mutation ($streamId: String!, $commentId: String!) {
        commentArchive(streamId: $streamId, commentId: $commentId)
      }
    `,
    variables: {
      streamId: resources.streamId,
      commentId: commentResult.data.commentCreate
    }
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
  const commentResult = await apollo.executeOperation({
    query: gql`
      mutation ($input: CommentCreateInput!) {
        commentCreate(input: $input)
      }
    `,
    variables: {
      input: {
        streamId: resources.streamId,
        text: 'i wrote this myself',
        data: {},
        resources: [
          { resourceId: resources.streamId, resourceType: 'stream' },
          { resourceId: resources.objectId, resourceType: 'object' }
        ]
      }
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
        id: commentResult.data.commentCreate,
        text: 'im going to overwrite myself'
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
        text: 'what you wrote is dump, here, let me fix it for you'
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
        text: 'what you wrote is dump, here, let me fix it for you',
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
  const commentId = await createComment({
    userId: resources.testActorId,
    input: {
      streamId: resources.streamId,
      text: 'im expecting some replies here',
      data: {},
      resources: [{ resourceId: resources.streamId, resourceType: 'stream' }]
    }
  })
  const numberOfComments = 3
  const commentIds = await Promise.all(
    Array(numberOfComments).fill(
      createCommentReply({
        authorId: resources.testActorId,
        parentCommentId: commentId,
        streamId: resources.streamId,
        data: {},
        text: 'fizz'
      })
    )
  )

  const res = await apollo.executeOperation({
    query: gql`
      query ($streamId: String!, $resources: [ResourceIdentifierInput]) {
        comments(streamId: $streamId, resources: $resources) {
          totalCount
          items {
            id
            text
          }
        }
      }
    `,
    variables: {
      streamId: resources.streamId,
      resources: [
        // i expected this to work as intersection, but it works as union
        { resourceId: resources.streamId, resourceType: 'stream' },
        { resourceId: commentId, resourceType: 'comment' }
      ]
    }
  })
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.comments.totalCount).to.equal(numberOfComments)
    expect(res.data.comments.items.map((i) => i.id)).to.deep.equalInAnyOrder(commentIds)
  })
}

// eslint-disable-next-line no-unused-vars
const actions = [
  'queryComments',
  'queryStreamCommentCount',
  'queryCommitCommentCount',
  'queryObjectCommentCount',
  'queryCommitCollectionCommentCount'
]

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

  const ownedStream = {
    name: 'stream owner',
    isPublic: true,
    role: Roles.Stream.Owner
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
            [editOthersComment, false],
            [replyToAComment, true],
            [queryComment, true],
            [queryComments, true]
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
            [queryComment, true] // should this be
          ]
        }
      ]
    }
  ]

  before(async () => {
    await beforeEachContext()
    myTestActor.id = await createUser(myTestActor)
    await Promise.all(
      [chadTheEngineer].map((user) =>
        createUser({ name: user.name, email: user.email, password: user.password })
          .then((id) => (user.id = id))
          .catch((err) => {
            throw err
          })
      )
    )

    ownedStream.id = await createStream({ ...ownedStream, ownerId: myTestActor.id })
  })
  testData.forEach((userContext) => {
    const user = userContext.user
    const apollo = buildApolloServer({
      context: () =>
        addLoadersToCtx({
          auth: true,
          userId: user?.id,
          role: user?.role,
          token: 'asd',
          scopes: AllScopes
        })
    })

    describe(`I, ${user?.name ?? 'Anonymous'} as a ${
      user?.role ?? 'shadow:lurker'
    }`, () => {
      userContext.streamData.forEach((streamContext) => {
        const stream = streamContext.stream
        let resources
        before(async () => {
          if (user)
            await grantPermissionsStream({
              streamId: stream.id,
              userId: user.id,
              role: stream.role
            })

          const objectId = await createObject(stream.id, { test: 'object' })

          const commentId = await createComment({
            userId: myTestActor.id,
            input: {
              streamId: stream.id,
              text: 'foo',
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
        describe(`testing ${
          streamContext.cases.length
        } cases of acting on a stream where I'm a ${
          user ? stream.role : 'trouble:maker'
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

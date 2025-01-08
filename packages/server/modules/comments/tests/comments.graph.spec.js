const expect = require('chai').expect

const crs = require('crypto-random-string')
const { buildApolloServer } = require('@/app')
const { beforeEachContext } = require('@/test/hooks')
const { Roles } = require('@/modules/core/helpers/mainConstants')
const { gql } = require('graphql-tag')
const {
  convertBasicStringToDocument
} = require('@/modules/core/services/richTextEditorService')
const {
  createTestContext,
  createAuthedTestContext,
  executeOperation
} = require('@/test/graphqlHelper')
const {
  streamResourceCheckFactory,
  createCommentFactory
} = require('@/modules/comments/services')
const {
  checkStreamResourceAccessFactory,
  markCommentViewedFactory,
  insertCommentsFactory,
  insertCommentLinksFactory,
  deleteCommentFactory
} = require('@/modules/comments/repositories/comments')
const { db } = require('@/db/knex')
const {
  validateInputAttachmentsFactory
} = require('@/modules/comments/services/commentTextService')
const { getBlobsFactory } = require('@/modules/blobstorage/repositories')
const { CommentsEmitter } = require('@/modules/comments/events/emitter')
const {
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory
} = require('@/modules/core/services/commit/management')
const {
  createCommitFactory,
  insertStreamCommitsFactory,
  insertBranchCommitsFactory
} = require('@/modules/core/repositories/commits')
const {
  getBranchByIdFactory,
  markCommitBranchUpdatedFactory,
  getStreamBranchByNameFactory,
  createBranchFactory
} = require('@/modules/core/repositories/branches')
const {
  getStreamFactory,
  createStreamFactory,
  updateStreamFactory,
  grantStreamPermissionsFactory,
  markCommitStreamUpdatedFactory
} = require('@/modules/core/repositories/streams')
const { VersionsEmitter } = require('@/modules/core/events/versionsEmitter')
const {
  getObjectFactory,
  storeSingleObjectIfNotFoundFactory,
  storeClosuresIfNotFoundFactory
} = require('@/modules/core/repositories/objects')
const {
  legacyCreateStreamFactory,
  createStreamReturnRecordFactory,
  legacyUpdateStreamFactory
} = require('@/modules/core/services/streams/management')
const {
  inviteUsersToProjectFactory
} = require('@/modules/serverinvites/services/projectInviteManagement')
const {
  createAndSendInviteFactory
} = require('@/modules/serverinvites/services/creation')
const {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const {
  collectAndValidateCoreTargetsFactory
} = require('@/modules/serverinvites/services/coreResourceCollection')
const {
  buildCoreInviteEmailContentsFactory
} = require('@/modules/serverinvites/services/coreEmailContents')
const { getEventBus } = require('@/modules/shared/services/eventBus')
const { ProjectsEmitter } = require('@/modules/core/events/projectsEmitter')
const { saveActivityFactory } = require('@/modules/activitystream/repositories')
const { publish } = require('@/modules/shared/utils/subscriptions')
const {
  addCommitCreatedActivityFactory
} = require('@/modules/activitystream/services/commitActivity')
const {
  getUsersFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} = require('@/modules/core/repositories/users')
const {
  findEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  createUserEmailFactory
} = require('@/modules/core/repositories/userEmails')
const {
  requestNewEmailVerificationFactory
} = require('@/modules/emails/services/verification/request')
const {
  deleteOldAndInsertNewVerificationFactory
} = require('@/modules/emails/repositories')
const { renderEmail } = require('@/modules/emails/services/emailRendering')
const { sendEmail } = require('@/modules/emails/services/sending')
const { createUserFactory } = require('@/modules/core/services/users/management')
const {
  validateAndCreateUserEmailFactory
} = require('@/modules/core/services/userEmails')
const {
  finalizeInvitedServerRegistrationFactory
} = require('@/modules/serverinvites/services/processing')
const { UsersEmitter } = require('@/modules/core/events/usersEmitter')
const { getServerInfoFactory } = require('@/modules/core/repositories/server')
const { createObjectFactory } = require('@/modules/core/services/objects/management')

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })
const streamResourceCheck = streamResourceCheckFactory({
  checkStreamResourceAccess: checkStreamResourceAccessFactory({ db })
})
const markCommentViewed = markCommentViewedFactory({ db })
const createComment = createCommentFactory({
  checkStreamResourcesAccess: streamResourceCheck,
  validateInputAttachments: validateInputAttachmentsFactory({
    getBlobs: getBlobsFactory({ db })
  }),
  insertComments: insertCommentsFactory({ db }),
  insertCommentLinks: insertCommentLinksFactory({ db }),
  deleteComment: deleteCommentFactory({ db }),
  markCommentViewed,
  commentsEventsEmit: CommentsEmitter.emit
})

const getObject = getObjectFactory({ db })
const createCommitByBranchId = createCommitByBranchIdFactory({
  createCommit: createCommitFactory({ db }),
  getObject,
  getBranchById: getBranchByIdFactory({ db }),
  insertStreamCommits: insertStreamCommitsFactory({ db }),
  insertBranchCommits: insertBranchCommitsFactory({ db }),
  markCommitStreamUpdated,
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
  versionsEventEmitter: VersionsEmitter.emit,
  addCommitCreatedActivity: addCommitCreatedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  })
})

const createCommitByBranchName = createCommitByBranchNameFactory({
  createCommitByBranchId,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getBranchById: getBranchByIdFactory({ db })
})

const getStream = getStreamFactory({ db })
const createStream = legacyCreateStreamFactory({
  createStreamReturnRecord: createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
        findUserByTarget: findUserByTargetFactory({ db }),
        insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
        collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
          getStream
        }),
        buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
          getStream
        }),
        emitEvent: ({ eventName, payload }) =>
          getEventBus().emit({
            eventName,
            payload
          }),
        getUser,
        getServerInfo
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})

const updateStream = legacyUpdateStreamFactory({
  updateStream: updateStreamFactory({ db })
})
const grantPermissionsStream = grantStreamPermissionsFactory({ db })

const findEmail = findEmailFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail,
  getUser: getUserFactory({ db }),
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})
const createUser = createUserFactory({
  getServerInfo,
  findEmail,
  storeUser: storeUserFactory({ db }),
  countAdminUsers: countAdminUsersFactory({ db }),
  storeUserAcl: storeUserAclFactory({ db }),
  validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
    createUserEmail: createUserEmailFactory({ db }),
    ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
    findEmail,
    updateEmailInvites: finalizeInvitedServerRegistrationFactory({
      deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
      updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
    }),
    requestNewEmailVerification
  }),
  usersEventsEmitter: UsersEmitter.emit
})
const createObject = createObjectFactory({
  storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db }),
  storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db })
})

function buildCommentInputFromString(textString) {
  return convertBasicStringToDocument(textString)
}

const testForbiddenResponse = (result) => {
  expect(result.errors, 'This should have failed').to.exist
  expect(result.errors.length).to.be.above(0)
  expect(result.errors[0].extensions.code).to.match(
    /(STREAM_INVALID_ACCESS_ERROR|FORBIDDEN|UNAUTHORIZED_ACCESS_ERROR)/
  )
}

const testResult = (shouldSucceed, result, successTests) => {
  if (shouldSucceed) {
    expect(result.errors, 'This should not have failed').to.not.exist
    successTests(result)
  } else {
    testForbiddenResponse(result)
  }
}

/**
 * @typedef {{
 * apollo: import('@/test/graphqlHelper').ServerAndContext,
 * resources: {
 *  streamId: string,
 * objectId: string,
 * commentId: string,
 * testActorId: string
 * },
 * shouldSucceed: boolean,
 * streamId: string
 * }} TestContext
 */

/**
 * @param {TestContext} param0
 */
const writeComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await executeOperation(
    apollo,
    gql`
      mutation ($input: CommentCreateInput!) {
        commentCreate(input: $input)
      }
    `,
    {
      input: {
        streamId: resources.streamId,
        text: buildCommentInputFromString('foo'),
        blobIds: [],
        data: {},
        resources: [{ resourceId: resources.streamId, resourceType: 'stream' }]
      }
    }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentCreate).to.be.string
    expect(res.data.commentCreate.length).to.equal(10)
  })
}

/**
 * @param {TestContext} param0
 */
const broadcastViewerActivity = async ({ apollo, resources, shouldSucceed }) => {
  const res = await executeOperation(
    apollo,
    gql`
      mutation ($streamId: String!, $resourceId: String!, $data: JSONObject) {
        userViewerActivityBroadcast(
          streamId: $streamId
          resourceId: $resourceId
          data: $data
        )
      }
    `,
    {
      streamId: resources.streamId,
      data: {},
      resourceId: resources.objectId
    }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.userViewerActivityBroadcast).to.be.true
  })
}

/**
 * @param {TestContext} param0
 */
const broadcastCommentActivity = async ({ apollo, resources, shouldSucceed }) => {
  const res = await executeOperation(
    apollo,
    gql`
      mutation ($streamId: String!, $commentId: String!, $data: JSONObject) {
        userCommentThreadActivityBroadcast(
          streamId: $streamId
          commentId: $commentId
          data: $data
        )
      }
    `,
    {
      streamId: resources.streamId,
      data: {},
      commentId: resources.commentId
    }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.userCommentThreadActivityBroadcast).to.be.true
  })
}

/**
 * @param {TestContext} param0
 */
const viewAComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await executeOperation(
    apollo,
    gql`
      mutation ($streamId: String!, $commentId: String!) {
        commentView(streamId: $streamId, commentId: $commentId)
      }
    `,
    {
      streamId: resources.streamId,
      commentId: resources.commentId
    }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentView).to.be.true
  })
}

/**
 * @param {TestContext} param0
 */
const archiveMyComment = async ({ apollo, resources, shouldSucceed }) => {
  const context = apollo.context
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
  const res = await executeOperation(
    apollo,
    gql`
      mutation ($streamId: String!, $commentId: String!) {
        commentArchive(streamId: $streamId, commentId: $commentId)
      }
    `,
    { streamId: resources.streamId, commentId }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentArchive).to.be.true
  })
}

/**
 * @param {TestContext} param0
 */
const archiveOthersComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await executeOperation(
    apollo,
    gql`
      mutation ($streamId: String!, $commentId: String!) {
        commentArchive(streamId: $streamId, commentId: $commentId)
      }
    `,
    {
      streamId: resources.streamId,
      commentId: resources.commentId
    }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentArchive).to.be.true
  })
}

/**
 * @param {TestContext} param0
 */
const editMyComment = async ({ apollo, resources, shouldSucceed }) => {
  const { id: commentId } = await createComment({
    userId: apollo.context.userId,
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
  const res = await executeOperation(
    apollo,
    gql`
      mutation ($input: CommentEditInput!) {
        commentEdit(input: $input)
      }
    `,
    {
      input: {
        streamId: resources.streamId,
        id: commentId,
        text: buildCommentInputFromString('im going to overwrite myself'),
        blobIds: []
      }
    }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentEdit).to.be.true
  })
}

/**
 * @param {TestContext} param0
 */
const editOthersComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await executeOperation(
    apollo,
    gql`
      mutation ($input: CommentEditInput!) {
        commentEdit(input: $input)
      }
    `,
    {
      input: {
        streamId: resources.streamId,
        id: resources.commentId,
        text: buildCommentInputFromString(
          'what you wrote is dumb, here, let me fix it for you'
        ),
        blobIds: []
      }
    }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentEdit).to.be.true
  })
}

/**
 * @param {TestContext} param0
 */
const replyToAComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await executeOperation(
    apollo,
    gql`
      mutation ($input: ReplyCreateInput!) {
        commentReply(input: $input)
      }
    `,
    {
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
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.commentReply).to.be.string
    expect(res.data.commentReply.length).to.equal(10)
  })
}

/**
 * @param {TestContext} param0
 */
const queryComment = async ({ apollo, resources, shouldSucceed }) => {
  const res = await executeOperation(
    apollo,
    gql`
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
    {
      id: resources.commentId,
      streamId: resources.streamId
    }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.comment.id).to.exist
    expect(res.data.comment.id).to.equal(resources.commentId)
  })
}

/**
 * @param {TestContext} param0
 */
const queryComments = async ({ apollo, resources, shouldSucceed }) => {
  const object = {
    foo: 123,
    bar: crs({ length: 5 })
  }

  const objectId = await createObject({ streamId: resources.streamId, object })

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

  const res = await executeOperation(
    apollo,
    gql`
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
    {
      streamId: resources.streamId,
      resources: [
        // i expected this to work as intersection, but it works as union
        { resourceId: objectId, resourceType: 'object' }
      ]
    }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.comments.totalCount).to.be.equal(numberOfComments)
    expect(res.data.comments.items.map((i) => i.id)).to.be.equalInAnyOrder(commentIds)
  })
}

/**
 * @param {TestContext} param0
 */
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

  const res = await executeOperation(
    apollo,
    gql`
      query ($id: String!) {
        stream(id: $id) {
          id
          commentCount
        }
      }
    `,
    { id: resources.streamId }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.stream.commentCount).to.be.greaterThanOrEqual(1)
  })
}

/**
 * @param {TestContext} param0
 */
const queryObjectCommentCount = async ({ apollo, resources, shouldSucceed }) => {
  const objectId = await createObject({
    streamId: resources.streamId,
    object: {
      foo: 'bar',
      noise: crs({ length: 5 })
    }
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

  const res = await executeOperation(
    apollo,
    gql`
      query ($id: String!, $objectId: String!) {
        stream(id: $id) {
          object(id: $objectId) {
            commentCount
          }
        }
      }
    `,
    { id: resources.streamId, objectId }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.stream.object.commentCount).to.equal(1)
  })
}

/**
 * @param {TestContext} param0
 */
const queryCommitCommentCount = async ({ apollo, resources, shouldSucceed }) => {
  const objectId = await createObject({
    streamId: resources.streamId,
    object: {
      foo: 'bar',
      notSignal: crs({ length: 10 })
    }
  })
  const { id: commitId } = await createCommitByBranchName({
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

  const res = await executeOperation(
    apollo,
    gql`
      query ($id: String!, $commitId: String!) {
        stream(id: $id) {
          commit(id: $commitId) {
            commentCount
          }
        }
      }
    `,
    { id: resources.streamId, commitId }
  )
  testResult(shouldSucceed, res, (res) => {
    expect(res.data.stream.commit.commentCount).to.equal(1)
  })
}

/**
 * @param {TestContext} param0
 */
const queryCommitCollectionCommentCount = async ({
  apollo,
  resources,
  shouldSucceed
}) => {
  const objectId = await createObject({
    streamId: resources.streamId,
    object: {
      foo: 'bar',
      almostMakesSense: crs({ length: 10 })
    }
  })
  const { id: commitId } = await createCommitByBranchName({
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

  const res = await executeOperation(
    apollo,
    gql`
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
    { id: resources.testActorId }
  )
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
        /**
         * @type {import('@/test/graphqlHelper').ServerAndContext}
         */
        let apollo

        before(async () => {
          apollo = {
            apollo: await buildApolloServer(),
            context: user
              ? await createAuthedTestContext(user.id, {
                  ...(user.role ? { role: user.role } : {})
                })
              : await createTestContext()
          }

          if (user && stream.role) {
            await grantPermissionsStream({
              streamId: stream.id,
              userId: user.id,
              role: stream.role
            })
          }

          const objectId = await createObject({
            streamId: stream.id,
            object: { test: 'object' }
          })

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

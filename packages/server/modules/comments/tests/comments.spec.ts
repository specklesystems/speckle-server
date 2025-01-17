import path from 'path'
import { packageRoot } from '@/bootstrap'
import { expect } from 'chai'
import crs from 'crypto-random-string'
import { beforeEachContext, truncateTables } from '@/test/hooks'

import {
  streamResourceCheckFactory,
  createCommentFactory,
  createCommentReplyFactory,
  editCommentFactory,
  archiveCommentFactory
} from '@/modules/comments/services/index'
import { convertBasicStringToDocument } from '@/modules/core/services/richTextEditorService'
import {
  ensureCommentSchema,
  buildCommentTextFromInput,
  validateInputAttachmentsFactory
} from '@/modules/comments/services/commentTextService'
import { get, range } from 'lodash'
import { buildApolloServer } from '@/app'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { createAuthTokenForUser } from '@/test/authHelper'
import { uploadBlob, UploadedBlob } from '@/test/blobHelper'
import { Comments } from '@/modules/core/dbSchema'
import * as CommentsGraphQLClient from '@/test/graphql/comments'
import {
  buildNotificationsStateTracker,
  NotificationsStateManager,
  purgeNotifications
} from '@/test/notificationsHelper'
import { NotificationType } from '@/modules/notifications/helpers/types'
import { EmailSendingServiceMock, CommentsRepositoryMock } from '@/test/mocks/global'
import { createAuthedTestContext, ServerAndContext } from '@/test/graphqlHelper'
import {
  checkStreamResourceAccessFactory,
  markCommentViewedFactory,
  insertCommentsFactory,
  insertCommentLinksFactory,
  deleteCommentFactory,
  markCommentUpdatedFactory,
  getCommentFactory,
  updateCommentFactory,
  getCommentsLegacyFactory,
  getResourceCommentCountFactory,
  getStreamCommentCountFactory
} from '@/modules/comments/repositories/comments'
import { db } from '@/db/knex'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import {
  getStreamFactory,
  createStreamFactory,
  markCommitStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import {
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory
} from '@/modules/core/services/commit/management'
import {
  createCommitFactory,
  insertStreamCommitsFactory,
  insertBranchCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getBranchByIdFactory,
  markCommitBranchUpdatedFactory,
  getStreamBranchByNameFactory,
  createBranchFactory
} from '@/modules/core/repositories/branches'
import {
  getObjectFactory,
  storeSingleObjectIfNotFoundFactory,
  storeClosuresIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import {
  legacyCreateStreamFactory,
  createStreamReturnRecordFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { publish } from '@/modules/shared/utils/subscriptions'
import { addCommitCreatedActivityFactory } from '@/modules/activitystream/services/commitActivity'
import {
  getUsersFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} from '@/modules/core/repositories/users'
import {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { createObjectFactory } from '@/modules/core/services/objects/management'
import type express from 'express'
import { ResourceType } from '@/modules/comments/domain/types'
import {
  CommentCreateInput,
  LegacyCommentViewerData,
  ReplyCreateInput
} from '@/modules/core/graph/generated/graphql'
import { CommentRecord } from '@/modules/comments/helpers/types'
import { MaybeNullOrUndefined } from '@speckle/shared'
import { CommentEvents } from '@/modules/comments/domain/events'

type LegacyCommentRecord = CommentRecord & {
  total_count: string
  resources: Array<{ resourceId: string; resourceType: string }>
}

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const getStream = getStreamFactory({ db })
const streamResourceCheck = streamResourceCheckFactory({
  checkStreamResourceAccess: checkStreamResourceAccessFactory({ db })
})
const markCommentViewed = markCommentViewedFactory({ db })
const validateInputAttachments = validateInputAttachmentsFactory({
  getBlobs: getBlobsFactory({ db })
})
const insertComments = insertCommentsFactory({ db })
const insertCommentLinks = insertCommentLinksFactory({ db })
const deleteComment = deleteCommentFactory({ db })
const createComment = createCommentFactory({
  checkStreamResourcesAccess: streamResourceCheck,
  validateInputAttachments,
  insertComments,
  insertCommentLinks,
  deleteComment,
  markCommentViewed,
  emitEvent: getEventBus().emit
})
const createCommentReply = createCommentReplyFactory({
  validateInputAttachments,
  insertComments,
  insertCommentLinks,
  checkStreamResourcesAccess: streamResourceCheck,
  deleteComment,
  markCommentUpdated: markCommentUpdatedFactory({ db }),
  emitEvent: getEventBus().emit
})
const getComment = getCommentFactory({ db })
const updateComment = updateCommentFactory({ db })
const editComment = editCommentFactory({
  getComment,
  validateInputAttachments,
  updateComment: updateCommentFactory({ db }),
  emitEvent: getEventBus().emit
})
const archiveComment = archiveCommentFactory({
  getComment,
  getStream,
  updateComment
})
const getComments = getCommentsLegacyFactory({ db })
const getResourceCommentCount = getResourceCommentCountFactory({ db })
const getStreamCommentCount = getStreamCommentCountFactory({ db })

const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })
const getObject = getObjectFactory({ db })
const createCommitByBranchId = createCommitByBranchIdFactory({
  createCommit: createCommitFactory({ db }),
  getObject,
  getBranchById: getBranchByIdFactory({ db }),
  insertStreamCommits: insertStreamCommitsFactory({ db }),
  insertBranchCommits: insertBranchCommitsFactory({ db }),
  markCommitStreamUpdated,
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
  emitEvent: getEventBus().emit,
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
    emitEvent: getEventBus().emit
  })
})

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
  emitEvent: getEventBus().emit
})
const createObject = createObjectFactory({
  storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db }),
  storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db })
})

function buildCommentInputFromString(textString?: string) {
  return convertBasicStringToDocument(textString || crs({ length: 10 }))
}

function generateRandomCommentText() {
  return buildCommentInputFromString(crs({ length: 10 }))
}

const mailerMock = EmailSendingServiceMock
const commentRepoMock = CommentsRepositoryMock

describe('Comments @comments', () => {
  let app: express.Express

  let notificationsState: NotificationsStateManager

  const user = {
    name: 'The comment wizard',
    email: 'comment@wizard.ry',
    password: 'i did not like Rivendel wine :(',
    id: ''
  }

  const otherUser = {
    name: 'Fondalf The Brey',
    email: 'totalnotfakegandalf87@mordor.com',
    password: 'what gandalf puts in his pipe stays in his pipe',
    id: ''
  }

  const stream = {
    name: 'Commented stream',
    description: 'Chit chats over here',
    id: ''
  }

  const testObject1 = {
    foo: 'bar',
    id: ''
  }

  const testObject2 = {
    foo: 'barbar',
    baz: 123,
    id: ''
  }

  let commitId1: string, commitId2: string

  before(async () => {
    await purgeNotifications()
    notificationsState = await buildNotificationsStateTracker()

    const { app: express } = await beforeEachContext()
    app = express

    user.id = await createUser(user)
    otherUser.id = await createUser(otherUser)

    stream.id = await createStream({ ...stream, ownerId: user.id })

    testObject1.id = await createObject({ streamId: stream.id, object: testObject1 })
    testObject2.id = await createObject({ streamId: stream.id, object: testObject2 })

    commitId1 = (
      await createCommitByBranchName({
        streamId: stream.id,
        branchName: 'main',
        message: 'first commit',
        sourceApplication: 'tests',
        objectId: testObject1.id,
        authorId: user.id
      })
    ).id
    commitId2 = (
      await createCommitByBranchName({
        streamId: stream.id,
        branchName: 'main',
        message: 'first commit',
        sourceApplication: 'tests',
        objectId: testObject2.id,
        authorId: user.id
      })
    ).id
  })

  after(() => {
    notificationsState.destroy()
    commentRepoMock.destroy()
  })

  afterEach(() => {
    commentRepoMock.disable()
    commentRepoMock.resetMockedFunctions()
  })

  it('Should be able to create a comment and a reply', async () => {
    let threadEventFired = false
    const threadFakeData = { justSome: crs({ length: 10 }) }

    getEventBus().listenOnce(
      CommentEvents.Created,
      async (payload) => {
        expect(payload.payload.comment.data).to.deep.equal(threadFakeData)
        threadEventFired = true
      },
      { timeout: 1000 }
    )

    const thread = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: commitId1, resourceType: ResourceType.Commit }],
        text: convertBasicStringToDocument('fakeout'),
        data: threadFakeData,
        blobIds: []
      }
    })

    expect(thread).to.be.ok
    expect(threadEventFired).to.be.ok

    let replyEventFired = false
    const replyFakeData = { justSome: crs({ length: 10 }) }
    getEventBus().listenOnce(
      CommentEvents.Created,
      async (payload) => {
        expect(payload.payload.comment.data).to.deep.equal(replyFakeData)
        expect(payload.payload.comment.parentComment).to.equal(thread.id)
        replyEventFired = true
      },
      { timeout: 1000 }
    )

    const reply = await createCommentReply({
      authorId: user.id,
      parentCommentId: thread.id,
      streamId: stream.id,
      text: buildCommentInputFromString('I am an 3l1t3 hack0r; - drop tables;'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: replyFakeData as any,
      blobIds: []
    })

    expect(reply).to.be.ok
    expect(replyEventFired).to.be.ok
  })

  it('Should not be allowed to comment without specifying at least one target resource', async () => {
    await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [],
        text: convertBasicStringToDocument('fakeout'),
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
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
    const throwawayCommentText = buildCommentInputFromString('whatever')

    // Stream A belongs to user
    const streamA = { name: 'Stream A', id: '' }
    streamA.id = await createStream({ ...streamA, ownerId: user.id })
    const objA = { foo: 'bar', id: '' }
    objA.id = await createObject({ streamId: streamA.id, object: objA })
    const commA = { id: '' }
    commA.id = (
      await createCommitByBranchName({
        streamId: streamA.id,
        branchName: 'main',
        message: 'baz',
        objectId: objA.id,
        authorId: user.id
      })
    ).id

    // Stream B belongs to otherUser
    const streamB = { name: 'Stream B', id: '' }
    streamB.id = await createStream({ ...streamB, ownerId: otherUser.id })
    const objB = { qux: 'mux', id: '' }
    objB.id = await createObject({ streamId: streamB.id, object: objB })
    const commB = { id: '' }
    commB.id = (
      await createCommitByBranchName({
        streamId: streamB.id,
        branchName: 'main',
        message: 'baz',
        objectId: objB.id,
        authorId: otherUser.id
      })
    ).id

    // create a comment on streamA but objectB
    await createComment({
      userId: user.id,
      input: {
        streamId: streamA.id,
        resources: [{ resourceId: objB.id, resourceType: ResourceType.Object }],
        text: throwawayCommentText,
        blobIds: [],
        data: {}
      }
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) =>
        expect(error.message).to.be.equal('Object not found in the specified stream')
      )

    // create a comment on streamA but commitB
    await createComment({
      userId: user.id,
      input: {
        streamId: streamA.id,
        resources: [{ resourceId: commB.id, resourceType: ResourceType.Commit }],
        text: throwawayCommentText,
        blobIds: [],
        data: {}
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
          { resourceId: commA.id, resourceType: ResourceType.Commit },
          { resourceId: commB.id, resourceType: ResourceType.Commit }
        ],
        text: throwawayCommentText,
        blobIds: [],
        data: {}
      }
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) => expect(error.message).to.be.equal('Commit not found'))

    // correct this time, let's see this one not fail
    const { id: correctCommentId } = await createComment({
      userId: user.id,
      input: {
        streamId: streamA.id,
        resources: [
          { resourceId: commA.id, resourceType: ResourceType.Commit },
          { resourceId: commA.id, resourceType: ResourceType.Commit }
        ],
        text: throwawayCommentText,
        blobIds: [],
        data: {}
      }
    })

    // replies should also not be swappable
    await createCommentReply({
      authorId: user.id,
      parentCommentId: correctCommentId,
      streamId: streamB.id,
      text: buildCommentInputFromString('I am an 3l1t3 hack0r; - drop tables;'),
      data: {},
      blobIds: []
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
    const stream = { name: 'Bean Counter', id: '' }
    stream.id = await createStream({ ...stream, ownerId: user.id })
    const obj = { foo: 'bar', id: '' }
    obj.id = await createObject({ streamId: stream.id, object: obj })
    const commit = { id: '' }
    commit.id = (
      await createCommitByBranchName({
        streamId: stream.id,
        branchName: 'main',
        message: 'baz',
        objectId: obj.id,
        authorId: user.id
      })
    ).id

    const commCount = 10
    const commentIds = []
    for (let i = 0; i < commCount; i++) {
      // creates 1 * commCount comments linked to commit and object
      commentIds.push(
        await createComment({
          userId: user.id,
          input: {
            text: buildCommentInputFromString('bar'),
            streamId: stream.id,
            resources: [
              { resourceId: commit.id, resourceType: ResourceType.Commit },
              { resourceId: obj.id, resourceType: ResourceType.Object }
            ],
            blobIds: [],
            data: {}
          }
        }).then((c) => c.id)
      )
      // creates 1 * commCount comments linked to commit only
      commentIds.push(
        await createComment({
          userId: user.id,
          input: {
            text: buildCommentInputFromString('baz'),
            streamId: stream.id,
            resources: [{ resourceId: commit.id, resourceType: ResourceType.Commit }],
            blobIds: [],
            data: {}
          }
        }).then((c) => c.id)
      )
      // creates 1 * commCount comments linked to object only
      commentIds.push(
        await createComment({
          userId: user.id,
          input: {
            text: buildCommentInputFromString('qux'),
            streamId: stream.id,
            resources: [{ resourceId: obj.id, resourceType: ResourceType.Object }],
            blobIds: [],
            data: {}
          }
        }).then((c) => c.id)
      )
    }

    // create some replies to foil the counts
    await createCommentReply({
      authorId: user.id,
      parentCommentId: commentIds[0],
      streamId: stream.id,
      text: buildCommentInputFromString(),
      data: {},
      blobIds: []
    })
    await createCommentReply({
      authorId: user.id,
      parentCommentId: commentIds[1],
      streamId: stream.id,
      text: buildCommentInputFromString(),
      data: {},
      blobIds: []
    })
    await createCommentReply({
      authorId: user.id,
      parentCommentId: commentIds[2],
      streamId: stream.id,
      text: buildCommentInputFromString(),
      data: {},
      blobIds: []
    })

    // we archive one of the object only comments for fun and profit
    await archiveComment({
      commentId: commentIds[commentIds.length - 1],
      userId: user.id,
      streamId: stream.id,
      archived: true
    })

    const count = await getStreamCommentCount(stream.id, { threadsOnly: true }) // should be 30
    expect(count).to.equal(commCount * 3 - 1)

    const objCount = await getResourceCommentCount({ resourceId: obj.id })
    expect(objCount).to.equal(commCount * 2 - 1)

    const commitCount = await getResourceCommentCount({ resourceId: commit.id })
    expect(commitCount).to.equal(commCount * 2)

    const streamOther = { name: 'Bean Counter', id: '' }
    streamOther.id = await createStream({ ...streamOther, ownerId: user.id })
    const objOther = { 'are you bored': 'yes', id: '' }
    objOther.id = await createObject({ streamId: streamOther.id, object: objOther })
    const commitOther = { id: '' }
    commitOther.id = (
      await createCommitByBranchName({
        streamId: streamOther.id,
        branchName: 'main',
        message: 'baz',
        objectId: objOther.id,
        authorId: user.id
      })
    ).id

    const countOther = await getStreamCommentCount(streamOther.id, {
      threadsOnly: true
    })
    expect(countOther).to.equal(0)

    const objCountOther = await getResourceCommentCount({
      resourceId: objOther.id
    })
    expect(objCountOther).to.equal(0)

    const commitCountOther = await getResourceCommentCount({
      resourceId: commitOther.id
    })
    expect(commitCountOther).to.equal(0)
  })

  it('Should create viewedAt entries for comments', async () => {
    const { id } = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: commitId1, resourceType: ResourceType.Commit }],
        text: buildCommentInputFromString(
          'https://tenor.com/view/gandalf-smoking-gif-21189890'
        ), // possibly NSFW
        data: {
          someMore:
            'https://tenor.com/view/gandalf-old-man-naked-take-robe-off-funny-gif-17224126'
        }, // possibly NSFW
        blobIds: []
      }
    })

    // ppl creating comments get to view them too
    const comment = await getComment({ id, userId: user.id })
    expect(comment).to.haveOwnProperty('viewedAt')

    const commentNoUser = await getComment({ id })
    expect(commentNoUser).to.not.haveOwnProperty('viewedAt')

    const commentOtherUser = await getComment({ id, userId: otherUser.id })
    expect(commentOtherUser!.viewedAt).to.be.null

    await markCommentViewed(id, user.id)

    const viewedCommentOtherUser = await getComment({ id, userId: otherUser.id })
    expect(viewedCommentOtherUser).to.haveOwnProperty('viewedAt')
  })

  it('Should not be allowed to comment targeting multiple streams as a resource', async () => {
    await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: ResourceType.Stream },
          { resourceId: commitId1, resourceType: ResourceType.Commit },
          { resourceId: stream.id, resourceType: ResourceType.Stream },
          { resourceId: testObject1.id, resourceType: ResourceType.Object }
        ],
        text: buildCommentInputFromString(),
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
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
        resources: [
          { resourceId: 'this doesnt exist dummy', resourceType: ResourceType.Stream }
        ],
        text: null,
        data: null
      },
      {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: ResourceType.Stream },
          { resourceId: 'this doesnt exist dummy', resourceType: ResourceType.Commit }
        ],
        text: null,
        data: null
      },
      {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: ResourceType.Stream },
          { resourceId: 'this doesnt exist dummy', resourceType: ResourceType.Object }
        ],
        text: null,
        data: null
      },
      {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: ResourceType.Stream },
          { resourceId: 'this doesnt exist dummy', resourceType: ResourceType.Comment }
        ],
        text: null,
        data: null
      }
    ]
    for (const input of nonExistentResources) {
      await createComment({
        userId: user.id,
        input: input as unknown as CommentCreateInput
      })
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
          { resourceId: stream.id, resourceType: ResourceType.Stream },
          {
            resourceId: 'jubbjabb',
            resourceType: 'flux capacitor' as unknown as ResourceType
          }
        ],
        text: buildCommentInputFromString(),
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
      }
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) => expect(error.message).to.not.be.null)
  })

  it('Should be able to comment on valid resources in any permutation', async () => {
    const resourceCombinations = [
      [{ resourceId: stream.id, resourceType: ResourceType.Stream }],
      [
        { resourceId: stream.id, resourceType: ResourceType.Stream },
        { resourceId: commitId1, resourceType: ResourceType.Commit }
      ],
      [
        { resourceId: stream.id, resourceType: ResourceType.Stream },
        { resourceId: commitId1, resourceType: ResourceType.Commit },
        { resourceId: testObject1.id, resourceType: ResourceType.Object }
      ],
      [
        // object overlay on object
        { resourceId: stream.id, resourceType: ResourceType.Stream },
        { resourceId: testObject1.id, resourceType: ResourceType.Object },
        { resourceId: testObject2.id, resourceType: ResourceType.Object }
      ],
      [
        // an object overlayed on a commit
        { resourceId: stream.id, resourceType: ResourceType.Stream },
        { resourceId: commitId1, resourceType: ResourceType.Commit },
        { resourceId: testObject2.id, resourceType: ResourceType.Object }
      ],
      [
        // an object overlayed on a commit
        { resourceId: stream.id, resourceType: ResourceType.Stream },
        { resourceId: commitId1, resourceType: ResourceType.Commit },
        { resourceId: testObject1.id, resourceType: ResourceType.Object },
        { resourceId: testObject2.id, resourceType: ResourceType.Object }
      ],
      [
        { resourceId: stream.id, resourceType: ResourceType.Stream },
        { resourceId: commitId1, resourceType: ResourceType.Commit },
        { resourceId: commitId2, resourceType: ResourceType.Commit },
        { resourceId: testObject1.id, resourceType: ResourceType.Object }
      ]
    ]

    // yeah i know, Promise.all, but this is easier to debug...
    for (const resources of resourceCombinations) {
      const { id: commentId } = await createComment({
        userId: user.id,
        input: {
          streamId: stream.id,
          resources,
          text: generateRandomCommentText(),
          data: { justSome: crs({ length: 10 }) },
          blobIds: []
        }
      })
      expect(commentId).to.exist
    }
  })

  it('Should not return the same comment multiple times for multi resource comments', async () => {
    const localObjectId = await createObject({
      streamId: stream.id,
      object: { testObject: 1 }
    })

    const commentCount = 3
    for (let i = 0; i < commentCount; i++) {
      await createComment({
        userId: user.id,
        input: {
          streamId: stream.id,
          resources: [
            { resourceId: stream.id, resourceType: ResourceType.Stream },
            { resourceId: commitId1, resourceType: ResourceType.Commit },
            { resourceId: localObjectId, resourceType: ResourceType.Object }
          ],
          text: generateRandomCommentText(),
          data: { justSome: 'distinct test' + crs({ length: 10 }) },
          blobIds: []
        }
      })
    }

    const comments = await getComments({
      streamId: stream.id,
      resources: [
        { resourceId: commitId1, resourceType: ResourceType.Commit },
        { resourceId: localObjectId, resourceType: ResourceType.Object }
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
    const localObjectId = await createObject({
      streamId: stream.id,
      object: {
        testObject: 'something completely different'
      }
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
              { resourceId: stream.id, resourceType: ResourceType.Stream },
              { resourceId: commitId1, resourceType: ResourceType.Commit },
              { resourceId: localObjectId, resourceType: ResourceType.Object }
            ],
            text: generateRandomCommentText(),
            data: { justSome: crs({ length: 10 }) },
            blobIds: []
          }
        }).then((c) => c.id)
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    let comments = await getComments({
      streamId: stream.id,
      resources: [
        { resourceId: commitId1, resourceType: ResourceType.Commit },
        { resourceId: localObjectId, resourceType: ResourceType.Object }
      ],
      limit: 2
    })
    expect(comments.items).to.have.lengthOf(2)
    expect(createdComments.reverse().slice(0, 2)).to.deep.equal(
      comments.items.map((c) => c.id)
    ) // note: reversing as default order is newest first now

    const cursor = comments.items[1].createdAt
    comments = await getComments({
      streamId: stream.id,
      resources: [
        { resourceId: commitId1, resourceType: ResourceType.Commit },
        { resourceId: localObjectId, resourceType: ResourceType.Object }
      ],
      limit: 2,
      cursor: cursor.toISOString()
    })
    expect(comments.items).to.have.lengthOf(2)
    expect(createdComments.slice(2, 4)).to.deep.equal(comments.items.map((c) => c.id))
  })

  it('Should properly return replies for a comment', async () => {
    const { id: streamCommentId1 } = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: stream.id, resourceType: ResourceType.Stream }],
        text: generateRandomCommentText(),
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
      }
    })

    const { id: commentId1 } = await createCommentReply({
      authorId: user.id,
      parentCommentId: streamCommentId1,
      streamId: stream.id,
      text: buildCommentInputFromString(),
      data: { justSome: crs({ length: 10 }) } as unknown as LegacyCommentViewerData,
      blobIds: []
    })

    const { id: commentId2 } = await createCommentReply({
      authorId: user.id,
      parentCommentId: streamCommentId1,
      streamId: stream.id,
      text: buildCommentInputFromString(),
      data: { justSome: crs({ length: 10 }) } as unknown as LegacyCommentViewerData,
      blobIds: []
    })
    const replies = await getComments({
      streamId: stream.id,
      replies: true,
      resources: [{ resourceId: streamCommentId1, resourceType: ResourceType.Comment }]
    })
    expect(replies.items).to.have.lengthOf(2)
    expect(replies.items.reverse().map((i) => i.id)).to.deep.equal([
      commentId1,
      commentId2
    ])
  })

  it('Should return all the referenced resources for a comment', async () => {
    const localObjectId = await createObject({
      streamId: stream.id,
      object: { anotherTestObject: 1 }
    })
    const inputResources = [
      { resourceId: stream.id, resourceType: ResourceType.Stream },
      { resourceId: commitId1, resourceType: ResourceType.Commit },
      { resourceId: localObjectId, resourceType: ResourceType.Object },
      { resourceId: testObject2.id, resourceType: ResourceType.Object }
    ]
    const queryResources = [
      { resourceId: stream.id, resourceType: ResourceType.Stream },
      { resourceId: localObjectId, resourceType: ResourceType.Object }
    ]
    await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: inputResources,
        text: generateRandomCommentText(),
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
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
    const localObjectId = await createObject({
      streamId: stream.id,
      object: { anotherTestObject: 42 }
    })
    await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: ResourceType.Stream },
          { resourceId: localObjectId, resourceType: ResourceType.Object }
        ],
        text: generateRandomCommentText(),
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
      }
    })
    const comments = await getComments({
      streamId: stream.id,
      resources: [{ resourceId: localObjectId, resourceType: ResourceType.Object }]
    })
    expect(comments.items).to.have.lengthOf(1)
    const firstComment: Record<string, unknown> & { id: string } = {
      ...comments.items[0]
    }
    const comment = await getComment({ id: firstComment.id })

    // the getComments query brings along some extra garbage i'm lazy to clean up
    delete firstComment.total_count
    delete firstComment.resourceType
    delete firstComment.resourceId
    delete firstComment.commentId

    expect(comment).to.deep.equal(firstComment)
  })

  it('Should be able to edit a comment text', async () => {
    const localObjectId = await createObject({
      streamId: stream.id,
      object: {
        anotherTestObject: crs({ length: 10 })
      }
    })

    const baseText = generateRandomCommentText()
    const { id: commentId } = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: ResourceType.Stream },
          { resourceId: localObjectId, resourceType: ResourceType.Object }
        ],
        text: baseText,
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
      }
    })

    let editEventFired = true
    const newText = buildCommentInputFromString('now thats what im talking about')
    getEventBus().listenOnce(
      CommentEvents.Updated,
      async (payload) => {
        expect(payload.payload.newComment.id).to.eq(commentId)
        expect(payload.payload.previousComment.id).to.eq(commentId)

        expect(
          ensureCommentSchema(payload.payload.previousComment.text!).doc
        ).to.deep.equal(baseText)
        expect(ensureCommentSchema(payload.payload.newComment.text!).doc).to.deep.equal(
          newText
        )
        editEventFired = true
      },
      { timeout: 1000 }
    )

    await editComment({
      userId: user.id,
      input: { id: commentId, text: newText, blobIds: [], streamId: stream.id },
      matchUser: true
    })
    const comment = await getComment({ id: commentId })
    const commentTextSchema = ensureCommentSchema(comment!.text || '')

    expect(commentTextSchema.doc).to.deep.equal(newText)
    expect(editEventFired).to.be.true
  })

  it('Should not be allowed to edit a not existing comment', async () => {
    await editComment({
      userId: user.id,
      input: { id: 'this is not going to be found', blobIds: [], streamId: 'a' },
      matchUser: true
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) => expect(error.message).to.be.equal("The comment doesn't exist"))
  })

  it('Should not be allowed to edit a comment of another user if its restricted', async () => {
    const localObjectId = await createObject({
      streamId: stream.id,
      object: {
        anotherTestObject: crs({ length: 10 })
      }
    })
    const { id: commentId } = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [
          { resourceId: stream.id, resourceType: ResourceType.Stream },
          { resourceId: localObjectId, resourceType: ResourceType.Object }
        ],
        text: generateRandomCommentText(),
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
      }
    })

    await editComment({
      userId: otherUser.id,
      input: {
        id: commentId,
        text: generateRandomCommentText(),
        blobIds: [],
        streamId: stream.id
      },
      matchUser: true
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) =>
        expect(error.message).to.be.equal("You cannot edit someone else's comments")
      )
    const properText = buildCommentInputFromString('fooood')
    await editComment({
      userId: user.id,
      input: { id: commentId, text: properText, blobIds: [], streamId: '' },
      matchUser: true
    })
    const comment = await getComment({ id: commentId })
    const commentText = ensureCommentSchema(comment!.text || '')
    expect(commentText.doc).to.deep.equalInAnyOrder(properText)
  })

  it('Should be able to archive a comment', async () => {
    const { id: commentId } = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: stream.id, resourceType: ResourceType.Stream }],
        text: generateRandomCommentText(),
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
      }
    })

    let comment = await getComment({ id: commentId })
    expect(comment!.archived).to.equal(false)

    await archiveComment({
      streamId: stream.id,
      commentId,
      userId: user.id,
      archived: true
    })

    comment = await getComment({ id: commentId })
    expect(comment!.archived).to.equal(true)

    await archiveComment({
      streamId: stream.id,
      commentId,
      userId: user.id,
      archived: false
    })

    comment = await getComment({ id: commentId })
    expect(comment!.archived).to.equal(false)
  })

  it('Should not be allowed to archive a not existing comment', async () => {
    await archiveComment({
      commentId: 'badabumm',
      streamId: stream.id,
      userId: user.id,
      archived: true
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
    const { id: commentId } = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: stream.id, resourceType: ResourceType.Stream }],
        text: generateRandomCommentText(),
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
      }
    })

    await archiveComment({
      commentId,
      streamId: stream.id,
      userId: otherUser.id,
      archived: true
    })
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((error) =>
        expect(error.message).to.be.equal(
          "You don't have permission to archive the comment"
        )
      )

    const { id: otherUsersCommentId } = await createComment({
      userId: otherUser.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: stream.id, resourceType: ResourceType.Stream }],
        text: generateRandomCommentText(),
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
      }
    })
    const archiveResult = await archiveComment({
      commentId: otherUsersCommentId,
      userId: user.id,
      streamId: stream.id,
      archived: true
    })
    expect(archiveResult).to.be.ok
  })

  it('Should not query archived comments unless asked', async () => {
    const localObjectId = await createObject({
      streamId: stream.id,
      object: {
        testObject: crs({ length: 10 })
      }
    })

    const commentCount = 15
    await Promise.all(
      range(commentCount).map(() =>
        createComment({
          userId: user.id,
          input: {
            streamId: stream.id,
            resources: [
              { resourceId: localObjectId, resourceType: ResourceType.Object }
            ],
            text: generateRandomCommentText(),
            data: { justSome: crs({ length: 10 }) },
            blobIds: []
          }
        })
      )
    )

    const archiveCount = 3
    let comments = await getComments({
      streamId: stream.id,
      resources: [{ resourceId: localObjectId, resourceType: ResourceType.Object }],
      limit: archiveCount
    })
    expect(comments.totalCount).to.be.equal(commentCount)

    await Promise.all(
      comments.items.map((comment) =>
        archiveComment({
          commentId: comment.id,
          streamId: stream.id,
          userId: user.id,
          archived: true
        })
      )
    )

    comments = await getComments({
      streamId: stream.id,
      resources: [{ resourceId: localObjectId, resourceType: ResourceType.Object }],
      limit: 100
    })
    expect(comments.totalCount).to.be.equal(commentCount - archiveCount)
    expect(comments.items.length).to.be.equal(commentCount - archiveCount)

    comments = await getComments({
      streamId: stream.id,
      resources: [{ resourceId: localObjectId, resourceType: ResourceType.Object }],
      limit: 100,
      archived: true
    })
    expect(comments.totalCount).to.be.equal(archiveCount)
    expect(comments.items.length).to.be.equal(archiveCount)
  })

  it('Should be able to write a short novel as comment text', async () => {
    const novelValue = buildCommentInputFromString(aShortNovel)
    const { id: commentId } = await createComment({
      userId: user.id,
      input: {
        streamId: stream.id,
        resources: [{ resourceId: stream.id, resourceType: ResourceType.Stream }],
        text: novelValue,
        data: { justSome: crs({ length: 10 }) },
        blobIds: []
      }
    })

    const comment = await getComment({ id: commentId })
    const commentText = ensureCommentSchema(comment!.text || '')

    expect(commentText.doc).to.deep.equal(novelValue)
  })

  describe('when authenticated', () => {
    let apollo: ServerAndContext
    let userToken: string
    let blob1: UploadedBlob

    before(async () => {
      const scopes = AllScopes

      // Init apollo instance w/ authenticated context
      apollo = {
        apollo: await buildApolloServer(),
        context: await createAuthedTestContext(user.id)
      }

      // Init token for authenticating w/ REST API
      userToken = await createAuthTokenForUser(user.id, scopes)

      // Upload a small blob
      blob1 = await uploadBlob(
        app,
        path.resolve(packageRoot, './test/assets/testimage1.jpg'),
        stream.id,
        {
          authToken: userToken
        }
      )
    })

    const createComment = (input = {}) =>
      CommentsGraphQLClient.createComment(apollo, {
        input: {
          streamId: stream.id,
          resources: [{ resourceId: commitId1, resourceType: ResourceType.Commit }],
          data: {},
          blobIds: [],
          ...input
        }
      })

    const createReply = (input?: ReplyCreateInput) =>
      CommentsGraphQLClient.createReply(apollo, {
        input: {
          streamId: stream.id,
          blobIds: [],
          parentComment: '',
          ...input
        }
      })

    describe('when reading comments', () => {
      let parentCommentId: string
      let emptyCommentId: string

      before(async () => {
        // Truncate comments
        await truncateTables([Comments.name])

        // Create a single comment with a blob
        const createCommentResult = await createComment({
          text: generateRandomCommentText(),
          blobIds: [blob1.blobId]
        })
        parentCommentId = createCommentResult.data!.commentCreate
        if (!parentCommentId) throw new Error('Comment creation failed!')

        // Create a reply with a blob
        await createReply({
          text: generateRandomCommentText(),
          blobIds: [blob1.blobId],
          parentComment: parentCommentId,
          streamId: stream.id
        })

        // Create a reply with a blob, but no text
        const emptyCommentResult = await createReply({
          blobIds: [blob1.blobId],
          parentComment: parentCommentId,
          streamId: stream.id
        })
        emptyCommentId = emptyCommentResult.data!.commentReply
        if (!emptyCommentId) throw new Error('Comment creation failed!')
      })

      const readComment = (input?: { id: string }) =>
        CommentsGraphQLClient.getComment(apollo, {
          streamId: stream.id,
          ...(input || { id: '' })
        })

      const readComments = (input = {}) =>
        CommentsGraphQLClient.getComments(apollo, {
          cursor: null,
          streamId: stream.id,
          ...input
        })

      it('both legacy (string) comments and new (ProseMirror) documents are formatted as SmartTextEditorValue values', async () => {
        commentRepoMock.enable()
        commentRepoMock.mockFunction('getCommentsLegacyFactory', () => {
          return async () => ({
            items: [
              // Legacy
              {
                id: 'a',
                text: 'hey dude! welcome to my legacy-type comment!',
                streamId: stream.id
              },
              // New
              {
                id: 'b',
                text: JSON.stringify(
                  buildCommentTextFromInput({
                    doc: buildCommentInputFromString('new comment schema here')
                  })
                ),
                streamId: stream.id
              },
              // New, but for some reason the text object is already deserialized
              {
                id: 'c',
                text: buildCommentTextFromInput({
                  doc: buildCommentInputFromString('another new comment schema here')
                }),
                streamId: stream.id
              }
            ] as unknown as Array<LegacyCommentRecord>,
            cursor: new Date().toISOString(),
            totalCount: 3
          })
        })

        const { data, errors } = await readComments()

        expect(errors?.length || 0).to.eq(0)
        expect(data?.comments?.items?.length || 0).to.eq(3)
      })

      it('legacy comment with a single link is formatted correctly', async () => {
        const item = {
          id: '1',
          text: 'https://aaa.com:3000/h3ll0-world/_?a=1&b=2#aaa',
          streamId: stream.id
        } as unknown as LegacyCommentRecord

        commentRepoMock.enable()
        commentRepoMock.mockFunction('getCommentsLegacyFactory', () => async () => ({
          items: [item],
          cursor: new Date().toISOString(),
          totalCount: 1
        }))

        const { data, errors } = await readComments()

        expect(data?.comments?.items?.length || 0).to.eq(1)
        expect(errors?.length || 0).to.eq(0)

        const textNode = get(data, 'comments.items[0].text.doc.content[0].content[0]')
        expect(textNode.text).to.eq(item.text)
        expect(textNode.marks).to.deep.equalInAnyOrder([
          {
            type: 'link',
            attrs: { href: item.text, target: '_blank' }
          }
        ])
      })

      it('legacy comment with multiple links formats them correctly', async () => {
        const textParts = [
          "Here's one ",
          // The period and comma def shouldn't belong to the following URL, but we have a pretty basic
          // URL regex and this only applies to legacy comments so that's acceptable IMO
          'https://google.com:4123/a1-_zd/z?a=1&b=2#aaa.,',
          ' oh and also - ',
          'https://yahoo.com',
          ' :D ',
          'http://agag.com:3000'
        ]

        const item = {
          id: '1',
          text: textParts.join(''),
          streamId: stream.id
        } as unknown as LegacyCommentRecord

        commentRepoMock.enable()
        commentRepoMock.mockFunction('getCommentsLegacyFactory', () => async () => ({
          items: [item],
          cursor: new Date().toISOString(),
          totalCount: 1
        }))

        const { data, errors } = await readComments()

        const runExpectationsOnTextNode = (idx: number, shouldBeLink: boolean) => {
          expect(textNodes[idx].text).to.eq(textParts[idx])

          if (shouldBeLink) {
            expect(textNodes[idx].marks).to.deep.equalInAnyOrder([
              {
                type: 'link',
                attrs: { href: textParts[idx], target: '_blank' }
              }
            ])
          }
        }

        expect(data?.comments?.items?.length || 0).to.eq(1)
        expect(errors?.length || 0).to.eq(0)

        const textNodes = get(data, 'comments.items[0].text.doc.content[0].content')
        expect(textNodes.length).to.eq(textParts.length)

        range(textParts.length).forEach((i) => {
          runExpectationsOnTextNode(i, textParts[i].startsWith('http'))
        })
      })

      it('returns uploaded attachment metadata correctly', async () => {
        const expectedMetadata = {
          fileName: blob1.fileName,
          id: blob1.blobId,
          streamId: stream.id
        }

        const { data, errors } = await readComments()

        expect(errors?.length || 0).to.eq(0)

        // Check first comment
        expect(data?.comments?.items?.length || 0).to.eq(1)
        expect(data?.comments?.items[0].text?.attachments?.length || 0).to.eq(1)
        expect(data?.comments?.items[0].text?.attachments?.[0]).to.deep.equalInAnyOrder(
          expectedMetadata
        )

        // Check first reply
        expect(data?.comments?.items[0].replies?.items?.length || 0).to.eq(2)
        expect(
          data?.comments?.items[0].replies.items[0].text?.attachments?.length || 0
        ).to.eq(1)
        expect(
          data?.comments?.items[0].replies.items[0].text?.attachments?.[0]
        ).to.deep.equalInAnyOrder(expectedMetadata)

        // Check 2nd reply
        expect(
          data?.comments?.items[0].replies.items[1].text?.attachments?.length || 0
        ).to.eq(1)
        expect(
          data?.comments?.items[0].replies.items[1].text?.attachments?.[0]
        ).to.deep.equalInAnyOrder(expectedMetadata)
      })

      it('returns raw text correctly', async () => {
        const { data } = await createReply({
          text: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'mention', attrs: { label: 'Heyyoo', id: '123' } },
                  { type: 'text', text: ' ' },
                  { type: 'text', text: 'helloooo!' }
                ]
              }
            ]
          },
          blobIds: [],
          parentComment: parentCommentId,
          streamId: stream.id
        })
        const commentId = data?.commentReply || ''

        const results = await readComment({
          id: commentId
        })
        expect(results).to.not.haveGraphQLErrors()
        expect(results.data?.comment?.rawText).to.eq('@Heyyoo helloooo!')
      })

      it('returns a blob comment without text correctly', async () => {
        const { data, errors } = await readComment({
          id: emptyCommentId
        })

        expect(errors?.length || 0).to.eq(0)
        expect(data?.comment).to.be.ok
        expect(data?.comment?.text.doc).to.be.null
        expect(data?.comment?.text.attachments?.length).to.be.greaterThan(0)
      })

      const unexpectedValDataset = [
        { display: 'number', value: 3 },
        { display: 'random object', value: { a: 1, b: 2 } }
      ]
      unexpectedValDataset.forEach(({ display, value }) => {
        it(`unexpected text value (${display}) in DB throw sanitized errors`, async () => {
          const item = {
            id: '1',
            text: value
          } as unknown as LegacyCommentRecord

          commentRepoMock.enable()
          commentRepoMock.mockFunction('getCommentsLegacyFactory', () => async () => ({
            items: [item],
            cursor: new Date().toISOString(),
            totalCount: 1
          }))

          const { data, errors } = await readComments()

          expect(data?.comments).to.not.be.ok
          expect((errors || []).map((e) => e.message).join(';')).to.contain(
            'Unexpected comment schema format'
          )
        })
      })
    })

    const creatingOrReplyingDataSet = [
      { replying: true, display: 'replying to an existing thread' },
      { creating: true, display: 'creating a new comment thread' }
    ]
    creatingOrReplyingDataSet.forEach(({ replying, creating, display }) => {
      let parentCommentId: string

      const createOrReplyComment = (input = {}) =>
        creating
          ? createComment(input)
          : createReply({
              parentComment: parentCommentId,
              blobIds: [],
              streamId: stream.id,
              ...input
            })

      const getResult = (
        data: MaybeNullOrUndefined<{ commentCreate?: unknown; commentReply?: unknown }>
      ) => (creating ? data?.commentCreate : data?.commentReply)

      describe(`when ${display}`, () => {
        before(async () => {
          if (replying) {
            // Create comment for attaching replies to
            const { data } = await createComment({
              text: generateRandomCommentText()
            })

            parentCommentId = data!.commentCreate
            if (!parentCommentId) {
              throw new Error("Couldn't successfully create comment for tests!")
            }
          }
        })

        it('invalid blob ids get rejected', async () => {
          const { data, errors } = await createOrReplyComment({
            blobIds: ['idunno'],
            text: generateRandomCommentText()
          })

          expect(getResult(data)).to.not.be.ok
          expect((errors || []).map((e) => e.message).join(';')).to.contain(
            'Attempting to attach invalid blobs to comment'
          )
        })

        it('valid blob ids get properly attached', async () => {
          const text = buildCommentInputFromString(
            "here's a comment with a nice attachment!!"
          )
          const { data, errors } = await createOrReplyComment({
            blobIds: [blob1.blobId],
            text
          })

          expect(getResult(data)).to.be.ok
          expect(errors || []).to.be.empty
        })

        const invalidInputDataSet = [
          {
            text: { invalid: { json: ['object'] } },
            blobIds: [],
            display: 'invalid input text'
          },
          { text: null, blobIds: [], display: 'no attachments & text' },
          {
            text: buildCommentInputFromString(' \n\n'),
            blobIds: [],
            display: 'no attachments & empty text'
          }
        ]
        invalidInputDataSet.forEach(({ text, blobIds, display }) => {
          it(`input with ${display} throws an error`, async () => {
            const { data, errors } = await createOrReplyComment({
              text,
              blobIds
            })

            expect(getResult(data)).to.not.be.ok
            expect((errors || []).map((e) => e.message).join(';')).to.contain(
              'Attempting to build comment text without document & attachments!'
            )
          })
        })

        it('an empty document with blobs attached can be successfully posted', async () => {
          const { data, errors } = await createOrReplyComment({
            blobIds: [blob1.blobId],
            text: undefined
          })

          expect(getResult(data)).to.be.ok
          expect(errors || []).to.be.empty
        })

        it('a document with only a single mention an be successfully posted', async () => {
          const results = await createOrReplyComment({
            blobIds: [],
            text: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'mention', attrs: { label: 'Some Guy', id: 'aabbcc' } }
                  ]
                }
              ]
            }
          })

          const data = getResult(results.data)
          expect(results).to.not.haveGraphQLErrors()
          expect(data).to.be.ok
        })

        describe('and mentioning a user', () => {
          const createOrReplyCommentWithMention = (targetUserId: string, input = {}) =>
            createOrReplyComment({
              text: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Hello ' },
                      {
                        type: 'mention',
                        attrs: { id: targetUserId, label: 'SOME GUY' }
                      },
                      { type: 'text', text: '!' }
                    ]
                  }
                ]
              },
              ...input
            })

          it('a valid mention triggers a notification', async () => {
            const sendEmailInvocations = mailerMock.hijackFunction(
              'sendEmail',
              async () => false
            )

            const waitForAck = notificationsState.waitForAck(
              (e) => e.result?.type === NotificationType.MentionedInComment
            )

            const { data, errors } = await createOrReplyCommentWithMention(otherUser.id)
            const result = getResult(data)

            expect(errors).to.be.not.ok
            expect(result).to.be.ok

            // Wait for
            await waitForAck

            const emailParams = sendEmailInvocations.args[0][0]
            expect(emailParams).to.be.ok
            expect(emailParams.subject).to.contain('mentioned in a Speckle comment')
            expect(emailParams.to).to.eq(otherUser.email)
          })
        })
      })
    })
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

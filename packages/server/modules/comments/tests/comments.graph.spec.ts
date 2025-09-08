import { expect } from 'chai'

import crs from 'crypto-random-string'
import { buildApolloServer } from '@/app'
import { beforeEachContext } from '@/test/hooks'
import { Roles } from '@/modules/core/helpers/mainConstants'
import gql from 'graphql-tag'
import { convertBasicStringToDocument } from '@/modules/core/services/richTextEditorService'
import type { ServerAndContext, ExecuteOperationResponse } from '@/test/graphqlHelper'
import {
  createTestContext,
  createAuthedTestContext,
  executeOperation
} from '@/test/graphqlHelper'
import {
  streamResourceCheckFactory,
  createCommentFactory
} from '@/modules/comments/services'
import {
  checkStreamResourceAccessFactory,
  markCommentViewedFactory,
  insertCommentsFactory,
  insertCommentLinksFactory,
  deleteCommentFactory,
  getCommentsResourcesFactory
} from '@/modules/comments/repositories/comments'
import { db } from '@/db/knex'
import { validateInputAttachmentsFactory } from '@/modules/comments/services/commentTextService'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import {
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory
} from '@/modules/core/services/commit/management'
import {
  createCommitFactory,
  insertStreamCommitsFactory,
  insertBranchCommitsFactory,
  getCommitsAndTheirBranchIdsFactory
} from '@/modules/core/repositories/commits'
import {
  getBranchByIdFactory,
  markCommitBranchUpdatedFactory,
  getStreamBranchByNameFactory
} from '@/modules/core/repositories/branches'
import {
  updateStreamFactory,
  grantStreamPermissionsFactory,
  markCommitStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import {
  getObjectFactory,
  storeSingleObjectIfNotFoundFactory,
  getStreamObjectsFactory
} from '@/modules/core/repositories/objects'
import { createObjectFactory } from '@/modules/core/services/objects/management'
import {
  getViewerResourcesFromLegacyIdentifiersFactory,
  getViewerResourcesForCommentsFactory
} from '@/modules/core/services/commit/viewerResources'
import type { SetNonNullable } from 'type-fest'
import { createProject } from '@/test/projectHelper'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import type { UpdateStreamRecord } from '@/modules/core/domain/streams/operations'
import { asMultiregionalOperation, replicateFactory } from '@/modules/shared/command'
import { logger } from '@/observability/logging'
import { getProjectReplicationDbs } from '@/modules/multiregion/utils/dbSelector'

const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })
const streamResourceCheck = streamResourceCheckFactory({
  checkStreamResourceAccess: checkStreamResourceAccessFactory({ db })
})
const markCommentViewed = markCommentViewedFactory({ db })

const getViewerResourcesFromLegacyIdentifiers =
  getViewerResourcesFromLegacyIdentifiersFactory({
    getViewerResourcesForComments: getViewerResourcesForCommentsFactory({
      getCommentsResources: getCommentsResourcesFactory({ db }),
      getViewerResourcesFromLegacyIdentifiers: (...args) =>
        getViewerResourcesFromLegacyIdentifiers(...args) // recursive dep
    }),
    getCommitsAndTheirBranchIds: getCommitsAndTheirBranchIdsFactory({ db }),
    getStreamObjects: getStreamObjectsFactory({ db })
  })

const createComment = createCommentFactory({
  checkStreamResourcesAccess: streamResourceCheck,
  validateInputAttachments: validateInputAttachmentsFactory({
    getBlobs: getBlobsFactory({ db })
  }),
  insertComments: insertCommentsFactory({ db }),
  insertCommentLinks: insertCommentLinksFactory({ db }),
  deleteComment: deleteCommentFactory({ db }),
  markCommentViewed,
  emitEvent: getEventBus().emit,
  getViewerResourcesFromLegacyIdentifiers
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
  emitEvent: getEventBus().emit
})

const createCommitByBranchName = createCommitByBranchNameFactory({
  createCommitByBranchId,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getBranchById: getBranchByIdFactory({ db })
})

const updateStream: UpdateStreamRecord = async (update) =>
  asMultiregionalOperation(
    async ({ allDbs }) => replicateFactory(allDbs, updateStreamFactory)(update),
    {
      logger,
      name: 'updateStream',
      dbs: await getProjectReplicationDbs({ projectId: update.id })
    }
  )

const grantPermissionsStream = grantStreamPermissionsFactory({ db })

const createObject = createObjectFactory({
  storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db })
})

function buildCommentInputFromString(textString: string) {
  return convertBasicStringToDocument(textString)
}

const testForbiddenResponse = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: ExecuteOperationResponse<Record<string, any>>
) => {
  expect(result.errors, 'This should have failed').to.exist
  expect(result.errors!.length).to.be.above(0)
  expect(result.errors![0].extensions!.code).to.match(
    /(STREAM_INVALID_ACCESS_ERROR|FORBIDDEN|UNAUTHORIZED_ACCESS_ERROR)/
  )
}

const testResult = (
  shouldSucceed: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: ExecuteOperationResponse<Record<string, any>>,
  successTests: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: SetNonNullable<ExecuteOperationResponse<Record<string, any>>, 'data'>
  ) => void
) => {
  if (shouldSucceed) {
    expect(
      result.errors,
      'This should not have failed and yet we found errors: ' +
        JSON.stringify(result.errors)
    ).to.not.exist
    successTests(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result as SetNonNullable<ExecuteOperationResponse<Record<string, any>>, 'data'>
    )
  } else {
    testForbiddenResponse(result)
  }
}

type TestContext = {
  apollo: ServerAndContext
  resources: {
    streamId: string
    objectId: string
    commentId: string
    testActorId: string
  }
  shouldSucceed: boolean
  streamId: string
}

const writeComment = async ({ apollo, resources, shouldSucceed }: TestContext) => {
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

const broadcastViewerActivity = async ({
  apollo,
  resources,
  shouldSucceed
}: TestContext) => {
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

const broadcastCommentActivity = async ({
  apollo,
  resources,
  shouldSucceed
}: TestContext) => {
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

const viewAComment = async ({ apollo, resources, shouldSucceed }: TestContext) => {
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

const archiveMyComment = async ({ apollo, resources, shouldSucceed }: TestContext) => {
  const context = apollo.context
  const { id: commentId } = await createComment({
    userId: context!.userId!,
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

const archiveOthersComment = async ({
  apollo,
  resources,
  shouldSucceed
}: TestContext) => {
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

const editMyComment = async ({ apollo, resources, shouldSucceed }: TestContext) => {
  const { id: commentId } = await createComment({
    userId: apollo.context!.userId!,
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

const editOthersComment = async ({ apollo, resources, shouldSucceed }: TestContext) => {
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

const replyToAComment = async ({ apollo, resources, shouldSucceed }: TestContext) => {
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

const queryComment = async ({ apollo, resources, shouldSucceed }: TestContext) => {
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

const queryComments = async ({ apollo, resources, shouldSucceed }: TestContext) => {
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
    expect(
      res.data.comments.items.map((i: { id: string }) => i.id)
    ).to.deep.equalInAnyOrder(commentIds)
  })
}

const queryStreamCommentCount = async ({
  apollo,
  resources,
  shouldSucceed
}: TestContext) => {
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

const queryObjectCommentCount = async ({
  apollo,
  resources,
  shouldSucceed
}: TestContext) => {
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

const queryCommitCommentCount = async ({
  apollo,
  resources,
  shouldSucceed
}: TestContext) => {
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

const queryCommitCollectionCommentCount = async ({
  apollo,
  resources,
  shouldSucceed
}: TestContext) => {
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
      .map((i: { commentCount: number }) => i.commentCount)
      .map((commentCount: number) => {
        expect(commentCount).to.be.greaterThanOrEqual(1)
      })
  })
}

describe('Graphql @comments', () => {
  // this user will be admin by default
  // it will be used to create all resources, that the other actors can
  // be tested against
  let myTestActor: BasicTestUser = {
    name: 'Gergo Jedlicska',
    email: 'gergo@jedlicska.com',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  const chadTheEngineer = {
    name: 'Chad the Engineer',
    email: 'chad@engineering.acme',
    password: 'tryingNotToBeACadMonkey',
    role: Roles.Server.User,
    id: ''
  }

  const archived = {
    name: 'The Balrog of Morgoth',
    email: 'durinsbane@moria.bridge',
    password: 'tryingNotToBeACadMonkey',
    role: Roles.Server.ArchivedUser,
    id: ''
  }

  const ownedStream = {
    name: 'stream owner',
    isPublic: false,
    role: Roles.Stream.Owner,
    id: ''
  }

  const contributorStream = {
    name: 'contributions are welcome',
    isPublic: false,
    role: Roles.Stream.Contributor,
    id: ''
  }

  const reviewerStream = {
    name: 'no work, just talk',
    isPublic: false,
    role: Roles.Stream.Reviewer,
    id: ''
  }

  const noAccessStream = {
    name: 'aint nobody canna cross it',
    isPublic: false,
    role: null,
    id: ''
  }

  const publicStream = {
    name: 'come take a look',
    isPublic: true,
    role: null,
    id: ''
  }

  const publicStreamWithPublicComments = {
    name: 'the gossip protocol',
    isPublic: true,
    role: null,
    id: ''
  }

  const testData = <const>[
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
            [editOthersComment, false],
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
            [editOthersComment, false],
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
            [queryComment, true],
            [queryComments, true],
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
    myTestActor = await createTestUser(myTestActor)
    await Promise.all(
      [chadTheEngineer, archived].map((user) =>
        createTestUser({ name: user.name, email: user.email, password: user.password })
          .then(({ id }) => (user.id = id))
          .catch((err) => {
            throw err
          })
      )
    )

    ownedStream.id = (
      await createProject({ ...ownedStream, ownerId: myTestActor.id })
    ).id
    contributorStream.id = (
      await createProject({
        ...contributorStream,
        ownerId: myTestActor.id
      })
    ).id
    reviewerStream.id = (
      await createProject({
        ...reviewerStream,
        ownerId: myTestActor.id
      })
    ).id
    noAccessStream.id = (
      await createProject({
        ...noAccessStream,
        ownerId: myTestActor.id
      })
    ).id
    publicStream.id = (
      await createProject({
        ...publicStream,
        ownerId: myTestActor.id
      })
    ).id
    publicStreamWithPublicComments.id = (
      await createProject({
        ...publicStreamWithPublicComments,
        ownerId: myTestActor.id
      })
    ).id
    await updateStream({
      ...publicStreamWithPublicComments,
      id: publicStreamWithPublicComments.id,
      allowPublicComments: true,
      updatedAt: new Date()
    })
  })

  testData.forEach((userContext) => {
    const user = userContext.user

    describe(`I, ${user?.name ?? 'Anonymous'} as a ${
      user?.role ?? 'shadow:lurker'
    }`, () => {
      userContext.streamData.forEach((streamContext) => {
        const stream = streamContext.stream
        let resources: TestContext['resources']
        let apollo: ServerAndContext

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

        describe(`testing ${streamContext.cases.length} cases of acting on "${
          stream.name
        }" stream where I ${
          user && stream.role ? 'have the role ' + stream.role : 'have no role'
        }`, () => {
          streamContext.cases.forEach(([testCase, shouldSucceed]) => {
            it(`${shouldSucceed ? 'should' : 'should not be allowed to'} ${
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

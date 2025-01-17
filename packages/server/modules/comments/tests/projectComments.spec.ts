import { CommentEvents } from '@/modules/comments/domain/events'
import { commentTextToRawString } from '@/modules/comments/services/commentTextService'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  CreateCommentInput,
  CreateCommentReplyInput,
  CreateProjectCommentDocument,
  CreateProjectCommentReplyDocument,
  EditCommentInput,
  EditProjectCommentDocument
} from '@/test/graphql/generated/graphql'
import {
  ExecuteOperationOptions,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import {
  BasicTestBranch,
  createTestBranches
} from '@/test/speckle-helpers/branchHelper'
import { BasicTestCommit, createTestCommits } from '@/test/speckle-helpers/commitHelper'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { SpeckleViewer } from '@speckle/shared'
import { RichTextEditor } from '@speckle/shared'
import { expect } from 'chai'

const resourceUrlBuilder = SpeckleViewer.ViewerRoute.resourceBuilder

describe('Project Comments', () => {
  const me: BasicTestUser = {
    name: 'hello itsa me',
    email: '',
    id: ''
  }
  const myStream: BasicTestStream = {
    name: 'this is my great stream #1',
    isPublic: true,
    ownerId: '',
    id: ''
  }
  const myBranch: BasicTestBranch = {
    name: 'nice branch!!',
    streamId: '',
    id: '',
    authorId: ''
  }
  const myCommit: BasicTestCommit = {
    id: '',
    objectId: '',
    streamId: '',
    authorId: '',
    message: 'this is my nice commit :)))',
    branchName: myBranch.name
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([me])
    await createTestStreams([[myStream, me]])
    await createTestBranches([{ branch: myBranch, stream: myStream, owner: me }])
    await createTestCommits([myCommit], { stream: myStream, owner: me })
  })

  describe('in GraphQL API', () => {
    let apollo: TestApolloServer

    before(async () => {
      apollo = await testApolloServer({
        authUserId: me.id
      })
    })

    const createProjectComment = async (
      input: CreateCommentInput,
      options?: ExecuteOperationOptions
    ) => await apollo.execute(CreateProjectCommentDocument, { input }, options)

    const createProjectCommentReply = async (input: CreateCommentReplyInput) =>
      await apollo.execute(CreateProjectCommentReplyDocument, { input })

    const editProjectComment = async (input: EditCommentInput) =>
      await apollo.execute(EditProjectCommentDocument, { input })

    it('can be created and replied to', async () => {
      const parentText = 'hello world111'

      let createEventFired = false
      getEventBus().listenOnce(
        CommentEvents.Created,
        ({ payload }) => {
          expect(commentTextToRawString(payload.comment.text)).to.equal(parentText)
          createEventFired = true
        },
        { timeout: 1000 }
      )

      const threadInput: CreateCommentInput = {
        projectId: myStream.id,
        resourceIdString: resourceUrlBuilder()
          .addModel(myBranch.id, myCommit.id)
          .toString(),
        content: {
          doc: RichTextEditor.convertBasicStringToDocument(parentText)
        }
      }

      const res1 = await createProjectComment(threadInput)
      const threadId = res1.data?.commentMutations.create.id

      expect(res1).to.not.haveGraphQLErrors()
      expect(threadId).to.be.ok
      expect(res1.data?.commentMutations.create.rawText).to.equal(parentText)
      expect(res1.data?.commentMutations.create.text.doc).to.be.ok
      expect(res1.data?.commentMutations.create.authorId).to.equal(me.id)
      expect(createEventFired).to.be.true
    })

    describe('after creation', async () => {
      let threadId: string

      before(async () => {
        const res = await createProjectComment(
          {
            projectId: myStream.id,
            resourceIdString: resourceUrlBuilder()
              .addModel(myBranch.id, myCommit.id)
              .toString(),
            content: {
              doc: RichTextEditor.convertBasicStringToDocument('some rando text lol')
            }
          },
          { assertNoErrors: true }
        )
        expect(res.data?.commentMutations.create.id).to.be.ok
        threadId = res.data!.commentMutations.create.id
      })

      it('can be replied to', async () => {
        const replyText = 'hello again bozo222'
        let replyEventFired = false
        getEventBus().listenOnce(
          CommentEvents.Created,
          ({ payload }) => {
            expect(commentTextToRawString(payload.comment.text)).to.equal(replyText)
            expect(payload.comment.parentComment).to.equal(threadId)
            replyEventFired = true
          },
          { timeout: 1000 }
        )

        const replyInput: CreateCommentReplyInput = {
          projectId: myStream.id,
          threadId: threadId!,
          content: {
            doc: RichTextEditor.convertBasicStringToDocument(replyText)
          }
        }
        const res2 = await createProjectCommentReply(replyInput)

        expect(res2).to.not.haveGraphQLErrors()
        expect(res2.data?.commentMutations.reply.rawText).to.equal(replyText)
        expect(res2.data?.commentMutations.reply.text.doc).to.be.ok
        expect(res2.data?.commentMutations.reply.authorId).to.equal(me.id)
        expect(replyEventFired).to.be.true
      })

      it('can be edited', async () => {
        const newText = 'new text here!!!'
        let editEventFired = false

        getEventBus().listenOnce(
          CommentEvents.Updated,
          ({ payload }) => {
            expect(commentTextToRawString(payload.newComment.text)).to.equal(newText)
            expect(payload.newComment.id).to.equal(threadId)
            editEventFired = true
          },
          { timeout: 1000 }
        )

        const res = await editProjectComment({
          commentId: threadId,
          content: {
            doc: RichTextEditor.convertBasicStringToDocument(newText)
          },
          projectId: myStream.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.commentMutations.edit.rawText).to.equal(newText)
        expect(res.data?.commentMutations.edit.text.doc).to.be.ok
        expect(res.data?.commentMutations.edit.authorId).to.equal(me.id)
        expect(editEventFired).to.be.true
      })
    })
  })
})

import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  CreateCommentInput,
  CreateProjectCommentDocument
} from '@/test/graphql/generated/graphql'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
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

    const createProjectComment = async (input: CreateCommentInput) =>
      await apollo.execute(CreateProjectCommentDocument, { input })

    it('can be created', async () => {
      const input: CreateCommentInput = {
        projectId: myStream.id,
        resourceIdString: resourceUrlBuilder()
          .addModel(myBranch.id, myCommit.id)
          .toString(),
        content: {
          doc: RichTextEditor.convertBasicStringToDocument('hello world')
        }
      }

      const res = await createProjectComment(input)

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.commentMutations.create.id).to.be.ok
      expect(res.data?.commentMutations.create.rawText).to.equal('hello world')
      expect(res.data?.commentMutations.create.text.doc).to.be.ok
      expect(res.data?.commentMutations.create.authorId).to.equal(me.id)
    })

    describe('after creation', () => {
      it.skip('can be retrieved through Project.comment')
    })
  })
})

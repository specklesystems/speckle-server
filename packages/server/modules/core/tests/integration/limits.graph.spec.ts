import type { CommentRecord } from '@/modules/comments/helpers/types'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { expectToThrow, itEach } from '@/test/assertionHelper'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUsers } from '@/test/authHelper'
import type {
  LimitedPersonalProjectCommentFragment,
  LimitedPersonalProjectVersionFragment,
  LimitedPersonalStreamCommitFragment
} from '@/modules/core/graph/generated/graphql'
import {
  CreateProjectDocument,
  CreateProjectInviteDocument,
  CreateProjectModelDocument,
  GetLimitedPersonalProjectCommentDocument,
  GetLimitedPersonalProjectCommentsDocument,
  GetLimitedPersonalProjectVersionDocument,
  GetLimitedPersonalProjectVersionsDocument,
  GetLimitedPersonalStreamCommitsDocument
} from '@/modules/core/graph/generated/graphql'
import type { TestApolloServer } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { createTestComment } from '@/test/speckle-helpers/commentHelper'
import type { BasicTestCommit } from '@/test/speckle-helpers/commitHelper'
import { createTestCommits } from '@/test/speckle-helpers/commitHelper'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'
import dayjs from 'dayjs'
import { flatten } from 'lodash-es'

const { FF_PERSONAL_PROJECTS_LIMITS_ENABLED } = getFeatureFlags()

;(FF_PERSONAL_PROJECTS_LIMITS_ENABLED ? describe : describe.skip)(
  'Personal project limits @graphql',
  () => {
    const me: BasicTestUser = {
      id: '',
      email: '',
      name: 'meeeeeee'
    }

    const preexistingProject: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'preexisting project',
      description: 'preexisting project',
      visibility: ProjectRecordVisibility.Private
    }

    let apollo: TestApolloServer

    before(async () => {
      await beforeEachContext()
      await createTestUsers([me])
      await createTestStreams([[preexistingProject, me]])
      apollo = await testApolloServer({ authUserId: me.id })
    })

    describe('history limits', () => {
      const oldVersion: BasicTestCommit = {
        id: '',
        objectId: '',
        streamId: '',
        authorId: '',
        branchId: '',
        createdAt: dayjs().subtract(8, 'day').toDate() // limit and -1 day
      }

      const newVersion: BasicTestCommit = {
        id: '',
        objectId: '',
        streamId: '',
        authorId: '',
        branchId: ''
      }

      let comments: CommentRecord[]

      before(async () => {
        // old & new commit
        await createTestCommits([oldVersion, newVersion], {
          owner: me,
          stream: preexistingProject
        })

        // old & new comment for each commit
        const commentCreateResults = await Promise.all(
          [newVersion, oldVersion].map(async (commit) => {
            const comments: CommentRecord[] = []

            // Old
            const oldComment = await createTestComment({
              userId: me.id,
              projectId: preexistingProject.id,
              modelId: commit.branchId,
              versionId: commit.id,
              createdAt: dayjs().subtract(8, 'day').toDate() // limit and -1 day
            })
            comments.push(oldComment)

            // New
            const newComment = await createTestComment({
              userId: me.id,
              projectId: preexistingProject.id,
              modelId: commit.branchId,
              versionId: commit.id
            })
            comments.push(newComment)

            return comments
          })
        )
        comments = flatten(commentCreateResults)
      })

      const checkComment = (comment: LimitedPersonalProjectCommentFragment) => {
        const isOldComment = dayjs(comment.createdAt).isBefore(
          dayjs().subtract(7, 'day')
        )

        if (isOldComment) {
          expect(comment.text).to.not.be.ok
          expect(comment.rawText).to.not.be.ok
        } else {
          expect(comment.text).to.be.ok
          expect(comment.rawText).to.be.ok
        }
      }

      const checkVersion = (
        version: BasicTestCommit,
        resultVersions: LimitedPersonalProjectVersionFragment[]
      ) => {
        const isOld = dayjs(version.createdAt).isBefore(dayjs().subtract(7, 'day'))

        const retVersion = resultVersions.find((v) => v.id === version.id)
        expect(retVersion).to.be.ok

        if (isOld) {
          expect(retVersion?.referencedObject).to.not.be.ok
        } else {
          expect(retVersion?.referencedObject).to.be.ok
        }

        const comments = retVersion?.commentThreads
        expect(comments).to.be.ok
        expect(comments?.totalCount).to.equal(2)
        comments?.items.forEach(checkComment)
      }

      const checkCommit = (
        commit: BasicTestCommit,
        resultCommits: LimitedPersonalStreamCommitFragment[]
      ) => {
        // const isOld = dayjs(commit.createdAt).isBefore(dayjs().subtract(7, 'day'))

        const retCommit = resultCommits.find((v) => v.id === commit.id)
        expect(retCommit).to.be.ok

        // if (isOld) {
        //   expect(retCommit?.referencedObject).to.not.be.ok
        // } else {
        //   expect(retCommit?.referencedObject).to.be.ok
        // }
      }

      it('followed when querying for project versions', async () => {
        const res = await apollo.execute(
          GetLimitedPersonalProjectVersionsDocument,
          {
            projectId: preexistingProject.id
          },
          { assertNoErrors: true }
        )

        const versions = res.data?.project.versions
        expect(versions?.items).to.be.ok
        expect(versions?.totalCount).to.equal(2)

        checkVersion(oldVersion, versions!.items)
        checkVersion(newVersion, versions!.items)
      })

      itEach(
        [{ old: true }, { old: false }],
        ({ old }) =>
          `followed when querying for ${old ? 'old' : 'new'} project version`,
        async ({ old }) => {
          const baseVersion = old ? oldVersion : newVersion
          const res = await apollo.execute(
            GetLimitedPersonalProjectVersionDocument,
            {
              projectId: preexistingProject.id,
              versionId: baseVersion.id
            },
            { assertNoErrors: true }
          )

          const version = res.data?.project.version
          expect(version).to.be.ok

          checkVersion(baseVersion, [version!])
        }
      )

      it('followed when querying for stream commits', async () => {
        const res = await apollo.execute(
          GetLimitedPersonalStreamCommitsDocument,
          {
            streamId: preexistingProject.id
          },
          { assertNoErrors: true }
        )

        const commits = res.data?.stream?.commits
        expect(commits?.items).to.be.ok

        checkCommit(newVersion, commits!.items!)
        await expectToThrow(() => checkCommit(oldVersion, commits!.items!)) // old commit should be filtered out
      })

      it('followed when querying for project comments', async () => {
        const res = await apollo.execute(
          GetLimitedPersonalProjectCommentsDocument,
          {
            projectId: preexistingProject.id
          },
          { assertNoErrors: true }
        )

        const comments = res.data?.project.commentThreads
        expect(comments?.items).to.be.ok
        expect(comments?.totalCount).to.equal(4) // 2 from each version
        comments?.items.forEach(checkComment)
      })

      it('followed when quering for project comment', async () => {
        const test = async (comment: CommentRecord) => {
          const res = await apollo.execute(
            GetLimitedPersonalProjectCommentDocument,
            {
              projectId: preexistingProject.id,
              commentId: comment.id
            },
            { assertNoErrors: true }
          )

          const resultComment = res.data?.project.comment
          expect(resultComment).to.be.ok
          checkComment(resultComment!)
        }

        await Promise.all(comments.map(test))
      })
    })

    it('prevent new personal project creation', async () => {
      const res = await apollo.execute(CreateProjectDocument, {
        input: {
          name: 'test personal project'
        }
      })

      expect(res).to.haveGraphQLErrors(
        "Projects can't be created outside of workspaces"
      )
      expect(res.data?.projectMutations.create.id).to.not.be.ok
    })

    it('prevent new invites to personal projects', async () => {
      const res = await apollo.execute(CreateProjectInviteDocument, {
        projectId: preexistingProject.id,
        input: {
          email: 'personalprojectlimitsinvite@example.com'
        }
      })

      expect(res).to.haveGraphQLErrors(
        'No new collaborators can be added to personal projects'
      )
      expect(res.data?.projectMutations.invites.create.id).to.not.be.ok
    })

    it('prevent new models in personal projects', async () => {
      const res = await apollo.execute(CreateProjectModelDocument, {
        input: {
          projectId: preexistingProject.id,
          name: 'test personal project model'
        }
      })

      expect(res).to.haveGraphQLErrors(
        'No new models can be added to personal projects'
      )
      expect(res.data?.modelMutations.create.id).to.not.be.ok
    })
  }
)

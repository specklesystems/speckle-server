import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import {
  createRandomEmail,
  createRandomPassword,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { testApolloServer } from '@/test/graphqlHelper'
import {
  CreateProjectVersionDocument,
  CreateWorkspaceDocument,
  CreateWorkspaceProjectDocument,
  GetProjectWithModelVersionsDocument,
  GetProjectWithVersionsDocument
} from '@/test/graphql/generated/graphql'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  countAdminUsersFactory,
  legacyGetUserFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import { createUserFactory } from '@/modules/core/services/users/management'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { WorkspaceReadOnlyError } from '@/modules/gatekeeper/errors/billing'
import { CreateVersionInput } from '@/modules/core/graph/generated/graphql'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { createTestUser, login } from '@/test/authHelper'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { BasicTestCommit, createTestCommit } from '@/test/speckle-helpers/commitHelper'
import { BranchCommits, Commits, StreamCommits } from '@/modules/core/dbSchema'
import { BasicTestBranch, createTestBranch } from '@/test/speckle-helpers/branchHelper'
import dayjs from 'dayjs'
import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'

const getServerInfo = getServerInfoFactory({ db })
const getUser = legacyGetUserFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail: findEmailFactory({ db }),
  getUser,
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})

const createUserEmail = validateAndCreateUserEmailFactory({
  createUserEmail: createUserEmailFactory({ db }),
  ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
  findEmail: findEmailFactory({ db }),
  updateEmailInvites: finalizeInvitedServerRegistrationFactory({
    deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
    updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
  }),
  requestNewEmailVerification
})

const findEmail = findEmailFactory({ db })
const createUser = createUserFactory({
  getServerInfo,
  findEmail,
  storeUser: storeUserFactory({ db }),
  countAdminUsers: countAdminUsersFactory({ db }),
  storeUserAcl: storeUserAclFactory({ db }),
  validateAndCreateUserEmail: createUserEmail,
  emitEvent: getEventBus().emit
})

const { FF_BILLING_INTEGRATION_ENABLED, FF_FORCE_PERSONAL_PROJECTS_LIMITS_ENABLED } =
  getFeatureFlags()

describe('Versions graphql @core', () => {
  before(async () => {
    await beforeEachContext()
  })

  describe('Create version mutation', () => {
    ;(FF_BILLING_INTEGRATION_ENABLED ? it : it.skip)(
      'should return error if project is read-only',
      async () => {
        const userId = await createUser({
          name: 'emails user',
          email: createRandomEmail(),
          password: createRandomPassword()
        })

        const apollo = await testApolloServer({ authUserId: userId })

        const workspaceCreateRes = await apollo.execute(CreateWorkspaceDocument, {
          input: { name: 'test ws' }
        })
        expect(workspaceCreateRes).to.not.haveGraphQLErrors()

        const workspace = workspaceCreateRes.data?.workspaceMutations.create

        const projectCreateRes = await apollo.execute(CreateWorkspaceProjectDocument, {
          input: { workspaceId: workspace!.id, name: 'test project' }
        })
        expect(projectCreateRes).to.not.haveGraphQLErrors()
        const project = projectCreateRes.data?.workspaceMutations.projects.create

        // Make the project read-only
        await db('workspace_plans')
          .update({ status: 'canceled' })
          .where({ workspaceId: workspace!.id })

        const versionCreateRes = await apollo.execute(CreateProjectVersionDocument, {
          input: {
            projectId: project!.id,
            modelId: 'modelid',
            objectId: 'objectid'
          } as unknown as CreateVersionInput
        })
        expect(versionCreateRes).to.haveGraphQLErrors()
        expect(versionCreateRes.errors).to.have.length(1)
        expect(versionCreateRes.errors![0].message).to.eq(
          new WorkspaceReadOnlyError().message
        )
      }
    )
  })
  ;(FF_FORCE_PERSONAL_PROJECTS_LIMITS_ENABLED ? describe : describe.skip)(
    'Version.referencedObject',
    () => {
      const tenDaysAgo = dayjs().subtract(10, 'day').toDate()
      it('should return version referencedObject if version is the last model version', async () => {
        const user = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail()
        })
        const workspace = {
          id: createRandomString(),
          name: createRandomString(),
          slug: createRandomString(),
          ownerId: user.id
        }
        await createTestWorkspace(workspace, user, {
          addPlan: { name: 'free', status: 'valid' }
        })

        const project1 = {
          id: '',
          name: createRandomString(),
          workspaceId: workspace.id
        }
        await createTestStream(project1, user)

        const model1: BasicTestBranch = {
          id: createRandomString(),
          name: createRandomString(),
          streamId: project1.id,
          authorId: user.id
        }
        await createTestBranch({
          branch: model1,
          stream: project1 as BasicTestStream,
          owner: user
        })

        const model2: BasicTestBranch = {
          id: createRandomString(),
          name: createRandomString(),
          streamId: project1.id,
          authorId: user.id
        }
        await createTestBranch({
          branch: model2,
          stream: project1 as BasicTestStream,
          owner: user
        })

        const version1 = {
          id: '',
          streamId: project1.id,
          branchName: model1.name
        }
        await createTestCommit(version1 as BasicTestCommit, {
          owner: user
        })
        await db(Commits.name)
          .where({ id: version1.id })
          .update({ createdAt: tenDaysAgo })
        const version2 = {
          streamId: project1.id,
          branchName: model1.name
        }
        await createTestCommit(version2 as BasicTestCommit, {
          owner: user
        })

        const version3 = {
          streamId: project1.id,
          branchName: model2.name
        }
        await createTestCommit(version3 as BasicTestCommit, {
          owner: user
        })

        const session = await login(user)

        const res = await session.execute(GetProjectWithModelVersionsDocument, {
          id: project1.id
        })
        expect(res).to.not.haveGraphQLErrors()
        const models = res.data?.project.models.items
        expect(models).to.have.length(2)
        const model1Versions = await db(Commits.name)
          .select([Commits.col.id, Commits.col.referencedObject])
          .join(BranchCommits.name, BranchCommits.col.commitId, Commits.col.id)
          .where({ branchId: model1.id })
          .orderBy(Commits.col.createdAt, 'desc')
        const model1VersionsRes = models?.[1].versions.items
        expect(model1VersionsRes).to.have.length(2)
        expect(model1VersionsRes?.[0]).to.deep.eq(model1Versions[0])
        expect(model1VersionsRes?.[1]).to.deep.eq({
          ...model1Versions[1],
          referencedObject: null
        })
      })
      it('should return version referencedObject if version is the last project version', async () => {
        const user = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail()
        })

        const project1 = {
          id: '',
          name: createRandomString()
        }
        await createTestStream(project1, user)

        const version1 = {
          id: '',
          streamId: project1.id
        }
        await createTestCommit(version1 as BasicTestCommit, {
          owner: user
        })
        const version2 = {
          id: createRandomString(),
          streamId: project1.id
        }
        await db(Commits.name)
          .where({ id: version1.id })
          .update({ createdAt: tenDaysAgo })
        await createTestCommit(version2 as BasicTestCommit, {
          owner: user
        })

        const project2 = {
          id: '',
          name: createRandomString()
        }
        await createTestStream(project2, user)

        const version3 = {
          streamId: project2.id
        }
        await createTestCommit(version3 as BasicTestCommit, {
          owner: user
        })
        const version4 = {
          streamId: project2.id
        }
        await createTestCommit(version4 as BasicTestCommit, {
          owner: user
        })

        const session = await login(user)

        const res = await session.execute(GetProjectWithVersionsDocument, {
          id: project1.id
        })
        expect(res).to.not.haveGraphQLErrors()
        const versions = res.data?.project.versions.items
        expect(versions).to.have.length(2)
        const project1Versions = await db(Commits.name)
          .select([Commits.col.id, Commits.col.referencedObject])
          .join(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
          .where({ streamId: project1.id })
          .orderBy(Commits.col.createdAt, 'desc')
        expect(versions?.[0]).to.deep.eq(project1Versions[0])
        expect(versions?.[1]).to.deep.eq({
          ...project1Versions[1],
          referencedObject: null
        })
      })
    }
  )
})

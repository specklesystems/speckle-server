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
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { BasicTestCommit, createTestCommit } from '@/test/speckle-helpers/commitHelper'
import { Commits, StreamCommits } from '@/modules/core/dbSchema'

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

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

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
  describe('Version.referencedObject', () => {
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
        streamId: project1.id
      }
      await createTestCommit(version1 as BasicTestCommit, {
        owner: user
      })
      const version2 = {
        id: createRandomString(),
        streamId: project1.id
      }
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
      expect(versions).to.deep.eq(project1Versions)
    })
  })
})

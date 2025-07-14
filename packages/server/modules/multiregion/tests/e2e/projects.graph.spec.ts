import { db } from '@/db/knex'
import { AutomationRecord, AutomationRunRecord } from '@/modules/automate/helpers/types'
import { markAutomationDeletedFactory } from '@/modules/automate/repositories/automations'
import { deleteAutomationFactory } from '@/modules/automate/services/automationManagement'
import { CommentRecord } from '@/modules/comments/helpers/types'
import { updateCommentFactory } from '@/modules/comments/repositories/comments'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import { StreamRecord } from '@/modules/core/helpers/types'
import { getDb } from '@/modules/multiregion/utils/dbSelector'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import {
  createWebhookConfigFactory,
  createWebhookEventFactory
} from '@/modules/webhooks/repositories/webhooks'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  UpdateProjectRegionDocument,
  GetProjectDocument,
  GetRegionalProjectModelDocument,
  GetRegionalProjectVersionDocument,
  GetRegionalProjectObjectDocument,
  GetRegionalProjectAutomationDocument,
  GetRegionalProjectCommentDocument,
  GetRegionalProjectWebhookDocument,
  GetRegionalProjectBlobDocument
} from '@/modules/core/graph/generated/graphql'
import { TestApolloServer, testApolloServer } from '@/test/graphqlHelper'
import {
  createTestAutomation,
  createTestAutomationRun
} from '@/test/speckle-helpers/automationHelper'
import { createTestBlob } from '@/test/speckle-helpers/blobHelper'
import { BasicTestBranch, createTestBranch } from '@/test/speckle-helpers/branchHelper'
import { createTestComment } from '@/test/speckle-helpers/commentHelper'
import {
  BasicTestCommit,
  createTestObject,
  createTestCommit
} from '@/test/speckle-helpers/commitHelper'
import {
  isMultiRegionTestMode,
  waitForRegionUser
} from '@/test/speckle-helpers/regions'
import {
  BasicTestStream,
  createTestStream,
  getUserStreamRole
} from '@/test/speckle-helpers/streamHelper'
import { retry, Roles, wait } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { Knex } from 'knex'
import { SetOptional } from 'type-fest'

const tables = {
  projects: (db: Knex) => db.table<StreamRecord>('streams')
}

const assertProjectRegion = async (
  projectId: string,
  regionKey: string
): Promise<void> => {
  const project = await tables.projects(db).select('*').where('id', projectId).first()

  if (!project || project.regionKey !== regionKey) {
    expect.fail('Project is not in expected region.')
  }
}

const ensureProjectRegion = async (
  projectId: string,
  regionKey: string
): Promise<void> => {
  await retry(async () => assertProjectRegion(projectId, regionKey), 30, 500)
}

const { FF_AUTOMATE_MODULE_ENABLED } = getFeatureFlags()

isMultiRegionTestMode()
  ? describe('Workspace project region changes @multiregion', () => {
      const regionKey1 = 'region1'
      const regionKey2 = 'region2'

      const adminUser: BasicTestUser = {
        id: '',
        name: 'John Speckle',
        email: createRandomEmail(),
        role: Roles.Server.Admin
      }

      const testWorkspace: SetOptional<BasicTestWorkspace, 'slug'> = {
        id: '',
        ownerId: '',
        name: 'Unlimited Workspace'
      }

      const testProject: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'Regional Project',
        isPublic: true
      }

      const emptyProject: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'Empty Regional Project',
        isPublic: true
      }

      const testModel: BasicTestBranch = {
        id: '',
        name: cryptoRandomString({ length: 8 }),
        streamId: '',
        authorId: ''
      }

      const testVersion: BasicTestCommit = {
        id: '',
        objectId: '',
        streamId: '',
        authorId: '',
        branchId: ''
      }

      let testAutomation: AutomationRecord
      let testAutomationRun: AutomationRunRecord

      let testComment: CommentRecord
      let testWebhookId: string
      let testBlobId: string

      let apollo: TestApolloServer
      let sourceRegionDb: Knex

      before(async () => {
        await createTestUser(adminUser)
        await waitForRegionUser(adminUser)

        apollo = await testApolloServer({ authUserId: adminUser.id })
        sourceRegionDb = await getDb({ regionKey: regionKey1 })
      })

      beforeEach(async () => {
        delete testWorkspace.slug

        await createTestWorkspace(testWorkspace, adminUser, {
          regionKey: regionKey1,
          addPlan: {
            name: 'unlimited',
            status: 'valid'
          }
        })

        emptyProject.workspaceId = testWorkspace.id
        testProject.workspaceId = testWorkspace.id

        await createTestStream(emptyProject, adminUser)
        await createTestStream(testProject, adminUser)
        await createTestBranch({
          stream: testProject,
          branch: testModel,
          owner: adminUser
        })

        testVersion.branchId = testModel.id
        testVersion.branchName = testModel.name
        testVersion.objectId = await createTestObject({ projectId: testProject.id })

        await createTestCommit(testVersion, {
          owner: adminUser,
          stream: testProject
        })

        const { automation: deletedAutomation } = await createTestAutomation({
          userId: adminUser.id,
          projectId: testProject.id
        })

        await deleteAutomationFactory({
          deleteAutomation: markAutomationDeletedFactory({ db: sourceRegionDb })
        })({ automationId: deletedAutomation.automation.id })

        const { automation, revision } = await createTestAutomation({
          userId: adminUser.id,
          projectId: testProject.id,
          revision: {
            functionId: cryptoRandomString({ length: 9 }),
            functionReleaseId: cryptoRandomString({ length: 9 })
          }
        })

        if (!revision) {
          throw new Error('Failed to create automation revision.')
        }

        testAutomation = automation.automation

        const { automationRun } = await createTestAutomationRun({
          userId: adminUser.id,
          projectId: testProject.id,
          automationId: testAutomation.id
        })

        testAutomationRun = automationRun

        testComment = await createTestComment({
          userId: adminUser.id,
          projectId: testProject.id,
          objectId: testVersion.objectId
        })

        const archivedComment = await createTestComment({
          userId: adminUser.id,
          projectId: testProject.id,
          objectId: testVersion.objectId
        })

        await updateCommentFactory({ db: sourceRegionDb })(archivedComment.id, {
          archived: true
        })

        testWebhookId = await createWebhookConfigFactory({ db: sourceRegionDb })({
          id: cryptoRandomString({ length: 9 }),
          streamId: testProject.id,
          url: 'https://example.org',
          description: cryptoRandomString({ length: 9 }),
          secret: cryptoRandomString({ length: 9 }),
          enabled: false,
          triggers: ['branch_create']
        })
        await createWebhookEventFactory({ db: sourceRegionDb })({
          id: cryptoRandomString({ length: 9 }),
          webhookId: testWebhookId,
          payload: cryptoRandomString({ length: 9 })
        })

        const testBlob = await createTestBlob({
          userId: adminUser.id,
          projectId: testProject.id
        })
        testBlobId = testBlob.blobId

        await assertProjectRegion(testProject.id, regionKey1)
      })

      it('moves project with no resources of a given type', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: emptyProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()
        await ensureProjectRegion(emptyProject.id, regionKey2)
      })

      it('moves project to region without breaking the target region', async () => {
        // Move a workspace project to region2
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: emptyProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()
        await ensureProjectRegion(emptyProject.id, regionKey2)

        // Create a new project in region2
        const testRegion2Workspace: BasicTestWorkspace = {
          id: '',
          ownerId: '',
          name: 'My Region 2 Workspace',
          slug: 'region-2-workspace'
        }
        await createTestWorkspace(testRegion2Workspace, adminUser, {
          regionKey: regionKey2,
          addPlan: {
            name: 'unlimited',
            status: 'valid'
          }
        })

        const testRegion2Project: BasicTestStream = {
          id: '',
          ownerId: '',
          name: 'My Region 2 Project',
          workspaceId: testRegion2Workspace.id
        }
        await createTestStream(testRegion2Project, adminUser)
        await ensureProjectRegion(testRegion2Project.id, regionKey2)
      })

      it('moves project to region and preserves project roles', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: emptyProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()
        // TODO: Change region move order of events to avoid wait
        await wait(10_000)
        const role = await getUserStreamRole(adminUser.id, emptyProject.id)
        if (!role || role !== Roles.Stream.Owner) {
          expect.fail('Did not preserve roles on project after region move.')
        }
      })

      it('moves project record to target regional db', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()

        await ensureProjectRegion(testProject.id, regionKey2)

        const resB = await apollo.execute(GetProjectDocument, {
          id: testProject.id
        })
        expect(resB).to.not.haveGraphQLErrors()

        expect(resB.data?.project.name).to.equal(testProject.name)
      })

      it('moves project models to target regional db', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()

        await ensureProjectRegion(testProject.id, regionKey2)

        const resB = await apollo.execute(GetRegionalProjectModelDocument, {
          projectId: testProject.id,
          modelId: testModel.id
        })
        expect(resB).to.not.haveGraphQLErrors()

        expect(resB.data?.project.model.name).to.equal(testModel.name)
      })

      it('moves project model versions to target regional db', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()

        await ensureProjectRegion(testProject.id, regionKey2)

        const resB = await apollo.execute(GetRegionalProjectVersionDocument, {
          projectId: testProject.id,
          modelId: testModel.id,
          versionId: testVersion.id
        })
        expect(resB).to.not.haveGraphQLErrors()

        expect(resB.data?.project.model.version.referencedObject).to.equal(
          testVersion.objectId
        )
      })

      it('moves project version objects to target regional db', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()

        await ensureProjectRegion(testProject.id, regionKey2)

        const resB = await apollo.execute(GetRegionalProjectObjectDocument, {
          projectId: testProject.id,
          objectId: testVersion.objectId
        })
        expect(resB).to.not.haveGraphQLErrors()

        expect(resB.data?.project.object).to.not.be.undefined
      })
      ;(FF_AUTOMATE_MODULE_ENABLED ? it : it.skip)(
        'moves project automations to target regional db',
        async () => {
          const resA = await apollo.execute(UpdateProjectRegionDocument, {
            projectId: testProject.id,
            regionKey: regionKey2
          })
          expect(resA).to.not.haveGraphQLErrors()

          await ensureProjectRegion(testProject.id, regionKey2)

          const resB = await apollo.execute(GetRegionalProjectAutomationDocument, {
            projectId: testProject.id,
            automationId: testAutomation.id
          })
          expect(resB).to.not.haveGraphQLErrors()

          expect(resB.data?.project.automation.id).to.equal(testAutomation.id)
          expect(resB.data?.project.automation.runs.items.at(0)?.id).to.equal(
            testAutomationRun.id
          )
          expect(
            resB.data?.project.automation.runs.items.at(0)?.functionRuns.length
          ).to.not.equal(0)
        }
      )

      it('moves project comments to target regional db', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()

        await ensureProjectRegion(testProject.id, regionKey2)

        const resB = await apollo.execute(GetRegionalProjectCommentDocument, {
          projectId: testProject.id,
          commentId: testComment.id
        })
        expect(resB).to.not.haveGraphQLErrors()

        expect(resB.data?.project.comment).to.not.be.undefined
      })

      it('moves project webhooks to target regional db', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()

        await ensureProjectRegion(testProject.id, regionKey2)

        const resB = await apollo.execute(GetRegionalProjectWebhookDocument, {
          projectId: testProject.id,
          webhookId: testWebhookId
        })
        expect(resB).to.not.haveGraphQLErrors()

        expect(resB.data?.project.webhooks.items.length).to.equal(1)
      })

      it('moves project files and associated blobs to target regional db and object storage', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()

        await ensureProjectRegion(testProject.id, regionKey2)

        const resB = await apollo.execute(GetRegionalProjectBlobDocument, {
          projectId: testProject.id,
          blobId: testBlobId
        })
        expect(resB).to.not.haveGraphQLErrors()

        expect(resB.data?.project.blob).to.not.be.undefined
      })
    })
  : void 0

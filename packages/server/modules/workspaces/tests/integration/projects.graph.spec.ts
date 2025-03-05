import { db } from '@/db/knex'
import { AutomationRecord, AutomationRunRecord } from '@/modules/automate/helpers/types'
import { CommentRecord } from '@/modules/comments/helpers/types'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'
import { getDb } from '@/modules/multiregion/utils/dbSelector'
import {
  createWebhookConfigFactory,
  createWebhookEventFactory
} from '@/modules/webhooks/repositories/webhooks'
import {
  assignToWorkspace,
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { describeEach } from '@/test/assertionHelper'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUser,
  createTestUsers
} from '@/test/authHelper'
import {
  ActiveUserProjectsWorkspaceDocument,
  CreateWorkspaceProjectDocument,
  GetProjectDocument,
  GetRegionalProjectAutomationDocument,
  GetRegionalProjectBlobDocument,
  GetRegionalProjectCommentDocument,
  GetRegionalProjectModelDocument,
  GetRegionalProjectObjectDocument,
  GetRegionalProjectVersionDocument,
  GetRegionalProjectWebhookDocument,
  GetWorkspaceProjectsDocument,
  GetWorkspaceTeamDocument,
  MoveProjectToWorkspaceDocument,
  ProjectUpdateRoleInput,
  UpdateProjectRegionDocument,
  UpdateProjectRoleDocument,
  UpdateWorkspaceProjectRoleDocument
} from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import {
  createTestAutomation,
  createTestAutomationRun
} from '@/test/speckle-helpers/automationHelper'
import { createTestBlob } from '@/test/speckle-helpers/blobHelper'
import { BasicTestBranch, createTestBranch } from '@/test/speckle-helpers/branchHelper'
import { createTestComment } from '@/test/speckle-helpers/commentHelper'
import {
  BasicTestCommit,
  createTestCommit,
  createTestObject
} from '@/test/speckle-helpers/commitHelper'
import {
  isMultiRegionTestMode,
  waitForRegionUser
} from '@/test/speckle-helpers/regions'
import {
  addToStream,
  BasicTestStream,
  createTestStream,
  getUserStreamRole
} from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { Knex } from 'knex'
import { SetOptional } from 'type-fest'

const grantStreamPermissions = grantStreamPermissionsFactory({ db })

describe('Workspace project GQL CRUD', () => {
  let apollo: TestApolloServer

  const workspace: BasicTestWorkspace = {
    id: '',
    ownerId: '',
    slug: cryptoRandomString({ length: 10 }),
    name: 'My Test Workspace'
  }

  const serverAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle-workspace-project-admin@example.org',
    role: Roles.Server.Admin
  }

  const serverMemberUser: BasicTestUser = {
    id: '',
    name: 'John Nobody',
    email: 'john-nobody@example.org',
    role: Roles.Server.User
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([serverAdminUser, serverMemberUser])
    const token = await createAuthTokenForUser(serverAdminUser.id, AllScopes)
    apollo = await testApolloServer({
      context: await createTestContext({
        auth: true,
        userId: serverAdminUser.id,
        token,
        role: serverAdminUser.role,
        scopes: AllScopes
      })
    })

    await createTestWorkspace(workspace, serverAdminUser)

    const workspaceProjects = [
      { name: 'Workspace Project A', workspaceId: workspace.id },
      { name: 'Workspace Project B', workspaceId: workspace.id },
      { name: 'Workspace Project C', workspaceId: workspace.id }
    ]

    await Promise.all(
      workspaceProjects.map((input) =>
        apollo.execute(CreateWorkspaceProjectDocument, { input })
      )
    )
  })

  describe('when changing workspace project roles', () => {
    const roleProject: BasicTestStream = {
      name: 'Role Project',
      isPublic: false,
      id: '',
      ownerId: ''
    }

    const roleWorkspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: cryptoRandomString({ length: 10 }),
      name: 'Role Workspace'
    }

    const workspaceGuest = serverMemberUser

    before(async () => {
      // TODO: Multiregion
      await createTestWorkspace(roleWorkspace, serverAdminUser)
      await assignToWorkspace(roleWorkspace, workspaceGuest, Roles.Workspace.Guest)

      roleProject.workspaceId = roleWorkspace.id
      await createTestStream(roleProject, serverAdminUser)
      await addToStream(roleProject, workspaceGuest, Roles.Stream.Reviewer)
    })

    describeEach(
      [{ oldResolver: true }, { oldResolver: false }],
      ({ oldResolver }) => `with ${oldResolver ? 'old' : 'new'} updateRole resolver`,
      ({ oldResolver }) => {
        const updateRole = async (input: ProjectUpdateRoleInput) => {
          if (oldResolver) {
            const res = await apollo.execute(UpdateProjectRoleDocument, {
              input
            })
            const project = res.data?.projectMutations?.updateRole
            return { res, project }
          } else {
            const res = await apollo.execute(UpdateWorkspaceProjectRoleDocument, {
              input
            })
            const project = res.data?.workspaceMutations?.projects?.updateRole
            return { res, project }
          }
        }

        it("can't set a workspace guest as a project owner", async () => {
          const { res } = await updateRole({
            projectId: roleProject.id,
            userId: workspaceGuest.id,
            role: Roles.Stream.Owner
          })
          const newRole = await getUserStreamRole(workspaceGuest.id, roleProject.id)

          expect(res).to.haveGraphQLErrors('Workspace guests cannot be project owners')
          expect(newRole).to.eq(Roles.Stream.Reviewer)
        })
      }
    )
  })

  describe('when specifying a workspace id during project creation', () => {
    it('should create the project in that workspace', async () => {
      const projectName = cryptoRandomString({ length: 6 })

      const createRes = await apollo.execute(CreateWorkspaceProjectDocument, {
        input: {
          name: projectName,
          workspaceId: workspace.id
        }
      })

      const getRes = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id
      })

      const workspaceProject = getRes.data?.workspace.projects.items.find(
        (project) => project.name === projectName
      )

      expect(createRes).to.not.haveGraphQLErrors()
      expect(getRes).to.not.haveGraphQLErrors()
      expect(workspaceProject).to.exist
    })
  })

  describe('when querying workspace projects', () => {
    it('should return multiple projects', async () => {
      const res = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id
      })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.workspace.projects.items.length).to.be.greaterThanOrEqual(3)
    })

    it('should respect limits', async () => {
      const res = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id,
        limit: 1
      })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.workspace.projects.items.length).to.equal(1)
    })

    it('should respect pagination', async () => {
      const resA = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id,
        limit: 10
      })

      const resB = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id,
        limit: 10,
        cursor: resA.data?.workspace.projects.cursor
      })

      const projectA = resA.data?.workspace.projects.items[0]
      const projectB = resB.data?.workspace.projects.items[0]

      expect(resA).to.not.haveGraphQLErrors()
      expect(resB).to.not.haveGraphQLErrors()
      expect(projectA).to.exist
      expect(projectB).to.not.exist
      expect(projectA?.name).to.not.equal(projectB?.name)
    })

    it('should respect search filters', async () => {
      const res = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id,
        limit: 1,
        filter: {
          search: 'Workspace Project B'
        }
      })

      const project = res.data?.workspace.projects.items[0]

      expect(res).to.not.haveGraphQLErrors()
      expect(project).to.exist
      expect(project?.name).to.equal('Workspace Project B')
    })

    it('should return workspace info on project types', async () => {
      const res = await apollo.execute(ActiveUserProjectsWorkspaceDocument, {})

      const projects = res.data?.activeUser?.projects.items

      expect(res).to.not.haveGraphQLErrors()
      expect(projects).to.exist
      expect(projects?.every((project) => project?.workspace?.id === workspace.id)).to
        .be.true
    })
  })

  describe('when moving a project to a workspace', () => {
    const testProject: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Test Project',
      isPublic: false
    }

    const targetWorkspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: cryptoRandomString({ length: 10 }),
      name: 'Target Workspace'
    }

    before(async () => {
      await createTestWorkspace(targetWorkspace, serverAdminUser)
    })

    beforeEach(async () => {
      await createTestStream(testProject, serverAdminUser)
      await grantStreamPermissions({
        streamId: testProject.id,
        userId: serverMemberUser.id,
        role: Roles.Stream.Contributor
      })
    })

    it('should move the project to the target workspace', async () => {
      const res = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: testProject.id,
        workspaceId: targetWorkspace.id
      })

      const { workspaceId } =
        res.data?.workspaceMutations.projects.moveToWorkspace ?? {}

      expect(res).to.not.haveGraphQLErrors()
      expect(workspaceId).to.equal(targetWorkspace.id)
    })

    it('should preserve project roles for project members', async () => {
      const res = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: testProject.id,
        workspaceId: targetWorkspace.id
      })

      const { team } = res.data?.workspaceMutations.projects.moveToWorkspace ?? {}

      const adminProjectRole = team?.find((role) => role.id === serverAdminUser.id)
      const memberProjectRole = team?.find((role) => role.id === serverMemberUser.id)

      expect(res).to.not.haveGraphQLErrors()
      expect(adminProjectRole?.role).to.equal(Roles.Stream.Owner)
      expect(memberProjectRole?.role).to.equal(Roles.Stream.Contributor)
    })

    it('should grant workspace roles to project members that are not already in the target workspace', async () => {
      const resA = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: testProject.id,
        workspaceId: targetWorkspace.id
      })
      const resB = await apollo.execute(GetWorkspaceTeamDocument, {
        workspaceId: targetWorkspace.id
      })

      const memberWorkspaceRole = resB.data?.workspace.team.items.find(
        (role) => role.id === serverMemberUser.id
      )

      expect(resA).to.not.haveGraphQLErrors()
      expect(resB).to.not.haveGraphQLErrors()
      expect(memberWorkspaceRole?.role).to.equal(Roles.Workspace.Member)
    })

    it('should preserve workspace roles for project members that are already in the target workspace', async () => {
      const resA = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: testProject.id,
        workspaceId: targetWorkspace.id
      })
      const resB = await apollo.execute(GetWorkspaceTeamDocument, {
        workspaceId: targetWorkspace.id
      })

      const adminWorkspaceRole = resB.data?.workspace.team.items.find(
        (role) => role.id === serverAdminUser.id
      )

      expect(resA).to.not.haveGraphQLErrors()
      expect(resB).to.not.haveGraphQLErrors()
      expect(adminWorkspaceRole?.role).to.equal(Roles.Workspace.Admin)
    })
  })
})

isMultiRegionTestMode()
  ? describe('Workspace project region changes', () => {
      const regionKey1 = 'region1'
      const regionKey2 = 'region2'

      const adminUser: BasicTestUser = {
        id: '',
        name: 'John Speckle',
        email: createRandomEmail()
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
        authorId: ''
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

        testProject.workspaceId = testWorkspace.id

        await createTestStream(testProject, adminUser)
        await createTestBranch({
          stream: testProject,
          branch: testModel,
          owner: adminUser
        })

        testVersion.branchName = testModel.name
        testVersion.objectId = await createTestObject({ projectId: testProject.id })

        await createTestCommit(testVersion, {
          owner: adminUser,
          stream: testProject
        })

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
      })

      it('moves project record to target regional db', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()

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

        const resB = await apollo.execute(GetRegionalProjectObjectDocument, {
          projectId: testProject.id,
          objectId: testVersion.objectId
        })
        expect(resB).to.not.haveGraphQLErrors()

        expect(resB.data?.project.object).to.not.be.undefined
      })

      it('moves project automations to target regional db', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()

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
      })

      it('moves project comments to target regional db', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()

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

        const resB = await apollo.execute(GetRegionalProjectBlobDocument, {
          projectId: testProject.id,
          blobId: testBlobId
        })
        expect(resB).to.not.haveGraphQLErrors()

        expect(resB.data?.project.blob).to.not.be.undefined
      })

      it('moves project files and associated blobs to target regional db and object storage', async () => {
        const resA = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })
        expect(resA).to.not.haveGraphQLErrors()

        const resB = await apollo.execute(GetRegionalProjectBlobDocument, {
          projectId: testProject.id,
          blobId: testBlobId
        })
        expect(resB).to.not.haveGraphQLErrors()

        expect(resB.data?.project.blob).to.not.be.undefined
      })
    })
  : void 0

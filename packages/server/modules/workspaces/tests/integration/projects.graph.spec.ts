import { db } from '@/db/knex'
import {
  AutomationFunctionRunRecord,
  AutomationRecord,
  AutomationRevisionFunctionRecord,
  AutomationRevisionRecord,
  AutomationRunRecord,
  AutomationRunTriggerRecord,
  AutomationTokenRecord,
  AutomationTriggerDefinitionRecord
} from '@/modules/automate/helpers/types'
import {
  AutomationFunctionRuns,
  AutomationRevisionFunctions,
  AutomationRevisions,
  AutomationRuns,
  AutomationRunTriggers,
  AutomationTokens,
  AutomationTriggers
} from '@/modules/core/dbSchema'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import {
  BranchCommitRecord,
  BranchRecord,
  CommitRecord,
  ObjectRecord,
  StreamCommitRecord,
  StreamRecord
} from '@/modules/core/helpers/types'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'
import { getDb } from '@/modules/multiregion/utils/dbSelector'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUser,
  createTestUsers
} from '@/test/authHelper'
import {
  ActiveUserProjectsWorkspaceDocument,
  CreateWorkspaceProjectDocument,
  GetWorkspaceProjectsDocument,
  GetWorkspaceTeamDocument,
  MoveProjectToWorkspaceDocument,
  UpdateProjectRegionDocument
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
import { BasicTestBranch, createTestBranch } from '@/test/speckle-helpers/branchHelper'
import {
  BasicTestCommit,
  createTestCommit,
  createTestObject
} from '@/test/speckle-helpers/commitHelper'
import {
  isMultiRegionTestMode,
  waitForRegionUser
} from '@/test/speckle-helpers/regions'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { Knex } from 'knex'
import { SetOptional } from 'type-fest'

const tables = {
  projects: (db: Knex) => db.table<StreamRecord>('streams'),
  models: (db: Knex) => db.table<BranchRecord>('branches'),
  versions: (db: Knex) => db.table<CommitRecord>('commits'),
  streamCommits: (db: Knex) => db.table<StreamCommitRecord>('stream_commits'),
  branchCommits: (db: Knex) => db.table<BranchCommitRecord>('branch_commits'),
  objects: (db: Knex) => db.table<ObjectRecord>('objects'),
  automations: (db: Knex) => db.table<AutomationRecord>('automations'),
  automationTokens: (db: Knex) => db<AutomationTokenRecord>(AutomationTokens.name),
  automationRevisions: (db: Knex) =>
    db<AutomationRevisionRecord>(AutomationRevisions.name),
  automationTriggers: (db: Knex) =>
    db<AutomationTriggerDefinitionRecord>(AutomationTriggers.name),
  automationRevisionFunctions: (db: Knex) =>
    db<AutomationRevisionFunctionRecord>(AutomationRevisionFunctions.name),
  automationRuns: (db: Knex) => db<AutomationRunRecord>(AutomationRuns.name),
  automationRunTriggers: (db: Knex) =>
    db<AutomationRunTriggerRecord>(AutomationRunTriggers.name),
  automationFunctionRuns: (db: Knex) =>
    db<AutomationFunctionRunRecord>(AutomationFunctionRuns.name)
}

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
      let testAutomationToken: AutomationTokenRecord
      let testAutomationRevision: AutomationRevisionRecord
      let testAutomationRun: AutomationRunRecord
      let testAutomationFunctionRuns: AutomationFunctionRunRecord[]

      let apollo: TestApolloServer
      let targetRegionDb: Knex

      before(async () => {
        await createTestUser(adminUser)
        await waitForRegionUser(adminUser)

        apollo = await testApolloServer({ authUserId: adminUser.id })
        targetRegionDb = await getDb({ regionKey: regionKey2 })
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
        testAutomationToken = automation.token
        testAutomationRevision = revision

        const { automationRun, functionRuns } = await createTestAutomationRun({
          userId: adminUser.id,
          projectId: testProject.id,
          automationId: testAutomation.id
        })

        testAutomationRun = automationRun
        testAutomationFunctionRuns = functionRuns
      })

      it('moves project record to target regional db', async () => {
        const res = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })

        expect(res).to.not.haveGraphQLErrors()

        // TODO: Replace with gql query when possible
        const project = await tables
          .projects(targetRegionDb)
          .select('*')
          .where({ id: testProject.id })
          .first()

        expect(project).to.not.be.undefined
      })

      it('moves project models to target regional db', async () => {
        const res = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })

        expect(res).to.not.haveGraphQLErrors()

        // TODO: Replace with gql query when possible
        const branch = await targetRegionDb
          .table<BranchRecord>('branches')
          .select('*')
          .where({ id: testModel.id })
          .first()

        expect(branch).to.not.be.undefined
      })

      it('moves project model versions to target regional db', async () => {
        const res = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })

        expect(res).to.not.haveGraphQLErrors()

        // TODO: Replace with gql query when possible
        const version = await tables
          .versions(targetRegionDb)
          .select('*')
          .where({ id: testVersion.id })
          .first()
        expect(version).to.not.be.undefined

        const streamCommitsRecord = await tables
          .streamCommits(targetRegionDb)
          .select('*')
          .where({ commitId: testVersion.id })
          .first()
        expect(streamCommitsRecord).to.not.be.undefined

        const branchCommitsRecord = await tables
          .branchCommits(targetRegionDb)
          .select('*')
          .where({ commitId: testVersion.id })
          .first()
        expect(branchCommitsRecord).to.not.be.undefined
      })

      it('moves project version objects to target regional db', async () => {
        const res = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })

        expect(res).to.not.haveGraphQLErrors()

        // TODO: Replace with gql query when possible
        const object = await tables
          .objects(targetRegionDb)
          .select('*')
          .where({ id: testVersion.objectId })
          .first()

        expect(object).to.not.be.undefined
      })

      it('moves project automation data to target regional db', async () => {
        const res = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })

        expect(res).to.not.haveGraphQLErrors()

        // TODO: Replace with gql query when possible
        const automation = await tables
          .automations(targetRegionDb)
          .select('*')
          .where({ id: testAutomation.id })
          .first()
        expect(automation).to.not.be.undefined

        const automationToken = await tables
          .automationTokens(targetRegionDb)
          .select('*')
          .where({ automationId: testAutomation.id })
          .first()
        expect(automationToken).to.not.be.undefined
        expect(automationToken?.automateToken).to.equal(
          testAutomationToken.automateToken
        )

        const automationRevision = await tables
          .automationRevisions(targetRegionDb)
          .select('*')
          .where({ automationId: testAutomation.id })
          .first()
        expect(automationRevision).to.not.be.undefined
        expect(automationRevision?.id).to.equal(testAutomationRevision.id)

        const automationTrigger = await tables
          .automationTriggers(targetRegionDb)
          .select('*')
          .where({ automationRevisionId: testAutomationRevision.id })
          .first()
        expect(automationTrigger).to.not.be.undefined
      })

      it('moves project automation runs to target regional db', async () => {
        const res = await apollo.execute(UpdateProjectRegionDocument, {
          projectId: testProject.id,
          regionKey: regionKey2
        })

        expect(res).to.not.haveGraphQLErrors()

        // TODO: Replace with gql query when possible
        const automationRun = await tables
          .automationRuns(targetRegionDb)
          .select('*')
          .where({ id: testAutomationRun.id })
          .first()
        expect(automationRun).to.not.be.undefined

        const automationRunTriggers = await tables
          .automationRunTriggers(targetRegionDb)
          .select('*')
          .where({ automationRunId: testAutomationRun.id })
        expect(automationRunTriggers.length).to.not.equal(0)

        const automationFunctionRuns = await tables
          .automationFunctionRuns(targetRegionDb)
          .select('*')
          .where({ runId: testAutomationRun.id })
        expect(automationFunctionRuns.length).to.equal(
          testAutomationFunctionRuns.length
        )
        expect(
          automationFunctionRuns.every((run) =>
            testAutomationFunctionRuns.some((testRun) => testRun.id === run.id)
          )
        )
      })
    })
  : void 0

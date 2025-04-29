import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser, login } from '@/test/authHelper'
import {
  ActiveUserProjectsDocument,
  CreateProjectDocument,
  CreateWorkspaceProjectDocument,
  GetWorkspaceDocument
} from '@/test/graphql/generated/graphql'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import { db } from '@/db/knex'
import { StreamAcl } from '@/modules/core/dbSchema'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

describe('Projects GraphQL @core', () => {
  describe('query user.projects', () => {
    ;(FF_WORKSPACES_MODULE_ENABLED ? it : it.skip)(
      'should return projects not in a workspace',
      async () => {
        const testAdminUser: BasicTestUser = {
          id: '',
          name: 'test',
          email: createRandomEmail(),
          role: Roles.Server.Admin,
          verified: true
        }
        await createTestUser(testAdminUser)
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser)

        const session = await login(testAdminUser)
        const getWorkspaceRes = await session.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(getWorkspaceRes).to.not.haveGraphQLErrors()
        const workspaceId = getWorkspaceRes.data!.workspace.id

        const createProjectInWorkspaceRes = await session.execute(
          CreateWorkspaceProjectDocument,
          { input: { name: 'project', workspaceId } }
        )
        expect(createProjectInWorkspaceRes).to.not.haveGraphQLErrors()

        const createProjectNonInWorkspaceRes = await session.execute(
          CreateProjectDocument,
          { input: { name: 'project' } }
        )
        expect(createProjectNonInWorkspaceRes).to.not.haveGraphQLErrors()
        const projectNonInWorkspace =
          createProjectNonInWorkspaceRes.data!.projectMutations.create

        const userProjectsRes = await session.execute(ActiveUserProjectsDocument, {
          filter: { personalOnly: true }
        })
        expect(userProjectsRes).to.not.haveGraphQLErrors()

        const projects = userProjectsRes.data!.activeUser!.projects.items

        expect(projects).to.have.length(1)
        expect(projects[0].id).to.eq(projectNonInWorkspace.id)
      }
    )
    ;(FF_WORKSPACES_MODULE_ENABLED ? it : it.skip)(
      'should return projects in workspace',
      async () => {
        const testAdminUser: BasicTestUser = {
          id: '',
          name: 'test',
          email: createRandomEmail(),
          role: Roles.Server.Admin,
          verified: true
        }
        await createTestUser(testAdminUser)
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser)

        const session = await login(testAdminUser)
        const getWorkspaceRes = await session.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(getWorkspaceRes).to.not.haveGraphQLErrors()
        const workspaceId = getWorkspaceRes.data!.workspace.id

        const createProjectInWorkspaceRes = await session.execute(
          CreateWorkspaceProjectDocument,
          { input: { name: 'project', workspaceId } }
        )
        expect(createProjectInWorkspaceRes).to.not.haveGraphQLErrors()
        const projectInWorkspace =
          createProjectInWorkspaceRes.data!.workspaceMutations.projects.create

        const createProjectNonInWorkspaceRes = await session.execute(
          CreateProjectDocument,
          { input: { name: 'project' } }
        )
        expect(createProjectNonInWorkspaceRes).to.not.haveGraphQLErrors()

        const userProjectsRes = await session.execute(ActiveUserProjectsDocument, {
          filter: { workspaceId }
        })
        expect(userProjectsRes).to.not.haveGraphQLErrors()

        const projects = userProjectsRes.data!.activeUser!.projects.items

        expect(projects).to.have.length(1)
        expect(projects[0].id).to.eq(projectInWorkspace.id)
      }
    )
    ;(FF_WORKSPACES_MODULE_ENABLED ? it : it.skip)(
      'should return all user projects',
      async () => {
        const testAdminUser: BasicTestUser = {
          id: '',
          name: 'test',
          email: createRandomEmail(),
          role: Roles.Server.Admin,
          verified: true
        }
        await createTestUser(testAdminUser)
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser)

        const session = await login(testAdminUser)
        const getWorkspaceRes = await session.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(getWorkspaceRes).to.not.haveGraphQLErrors()
        const workspaceId = getWorkspaceRes.data!.workspace.id

        const createProjectInWorkspaceRes = await session.execute(
          CreateWorkspaceProjectDocument,
          { input: { name: 'project', workspaceId } }
        )
        expect(createProjectInWorkspaceRes).to.not.haveGraphQLErrors()

        const createProjectNonInWorkspaceRes = await session.execute(
          CreateProjectDocument,
          { input: { name: 'project' } }
        )
        expect(createProjectNonInWorkspaceRes).to.not.haveGraphQLErrors()

        const userProjectsRes = await session.execute(ActiveUserProjectsDocument, {
          filter: {}
        })
        expect(userProjectsRes).to.not.haveGraphQLErrors()

        const projects = userProjectsRes.data!.activeUser!.projects.items

        expect(projects).to.have.length(2)
      }
    )
    ;(FF_WORKSPACES_MODULE_ENABLED ? it : it.skip)(
      'should return all user projects sorted by user role',
      async () => {
        const testAdminUser: BasicTestUser = {
          id: '',
          name: 'test',
          email: createRandomEmail(),
          role: Roles.Server.Admin,
          verified: true
        }
        await createTestUser(testAdminUser)
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser)

        const session = await login(testAdminUser)
        const getWorkspaceRes = await session.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(getWorkspaceRes).to.not.haveGraphQLErrors()
        const workspaceId = getWorkspaceRes.data!.workspace.id

        const createProjectInWorkspaceAsOwnerRes = await session.execute(
          CreateWorkspaceProjectDocument,
          { input: { name: 'project', workspaceId } }
        )
        expect(createProjectInWorkspaceAsOwnerRes).to.not.haveGraphQLErrors()
        const createProjectInWorkspaceAsContributorRes = await session.execute(
          CreateWorkspaceProjectDocument,
          { input: { name: 'project 2', workspaceId } }
        )
        expect(createProjectInWorkspaceAsContributorRes).to.not.haveGraphQLErrors()
        const projectContributorId =
          createProjectInWorkspaceAsContributorRes.data?.workspaceMutations.projects
            .create.id
        await db(StreamAcl.name)
          .update({ role: Roles.Stream.Contributor })
          .where({ userId: testAdminUser.id, resourceId: projectContributorId })
        const createProjectInWorkspaceAsReviewerRes = await session.execute(
          CreateWorkspaceProjectDocument,
          { input: { name: 'project 3', workspaceId } }
        )
        expect(createProjectInWorkspaceAsReviewerRes).to.not.haveGraphQLErrors()
        const projectReviewerId =
          createProjectInWorkspaceAsReviewerRes.data?.workspaceMutations.projects.create
            .id
        await db(StreamAcl.name)
          .update({ role: Roles.Stream.Reviewer })
          .where({ userId: testAdminUser.id, resourceId: projectReviewerId })

        const userProjectsRes = await session.execute(ActiveUserProjectsDocument, {
          filter: {},
          sortBy: ['role']
        })
        expect(userProjectsRes).to.not.haveGraphQLErrors()

        const projects = userProjectsRes.data!.activeUser!.projects.items

        expect(projects).to.have.length(3)
        expect(projects[0].id).to.eq(
          createProjectInWorkspaceAsOwnerRes.data?.workspaceMutations.projects.create.id
        )
        expect(projects[1].id).to.eq(projectContributorId)
        expect(projects[2].id).to.eq(projectReviewerId)
      }
    )
  })
})

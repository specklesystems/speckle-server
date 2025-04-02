import { db } from '@/db/knex'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import { getWorkspaceUserSeatsFactory } from '@/modules/gatekeeper/repositories/workspaceSeat'
import { WorkspaceInvalidRoleError } from '@/modules/workspaces/errors/workspace'
import {
  assignToWorkspace,
  assignToWorkspaces,
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { describeEach, itEach } from '@/test/assertionHelper'
import { BasicTestUser, createTestUser, createTestUsers } from '@/test/authHelper'
import {
  ActiveUserProjectsWorkspaceDocument,
  CreateWorkspaceProjectDocument,
  GetWorkspaceProjectsDocument,
  GetWorkspaceProjectsQuery,
  GetWorkspaceTeamDocument,
  MoveProjectToWorkspaceDocument,
  ProjectUpdateRoleInput,
  UpdateProjectRoleDocument,
  UpdateWorkspaceProjectRoleDocument
} from '@/test/graphql/generated/graphql'
import {
  ExecuteOperationResponse,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { EnvHelperMock } from '@/test/mocks/global'
import {
  addToStream,
  BasicTestStream,
  createTestStream,
  getUserStreamRole
} from '@/test/speckle-helpers/streamHelper'
import { Nullable, Optional, Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import dayjs from 'dayjs'
import { times } from 'lodash'

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
    apollo = await testApolloServer({
      authUserId: serverAdminUser.id
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
    const workspaceGuest: BasicTestUser = {
      id: '',
      name: 'John Guest 2',
      email: 'johnguest2@bababooey.com'
    }

    const workspaceEditor: BasicTestUser = {
      id: '',
      name: 'John Editor 2',
      email: 'johneditor2@bababooey.com'
    }

    const workspaceMemberViewer: BasicTestUser = {
      id: '',
      name: 'John Member Viewer',
      email: 'johnmemberviewer@bababooey.com'
    }

    before(async () => {
      await Promise.all([
        createTestUser(workspaceGuest),
        createTestUser(workspaceEditor),
        createTestUser(workspaceMemberViewer)
      ])
    })

    describeEach(
      [{ oldPlan: true }, { oldPlan: false }],
      ({ oldPlan }) => `with ${oldPlan ? 'old (business)' : 'new (pro)'} plan`,
      ({ oldPlan }) => {
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

        before(async () => {
          // TODO: Multiregion
          await createTestWorkspace(roleWorkspace, serverAdminUser, {
            addPlan: oldPlan
              ? { name: 'business', status: 'valid' }
              : { name: 'pro', status: 'valid' }
          })
          roleProject.workspaceId = roleWorkspace.id

          await Promise.all([
            assignToWorkspace(roleWorkspace, workspaceGuest, Roles.Workspace.Guest),
            assignToWorkspace(
              roleWorkspace,
              workspaceEditor,
              Roles.Workspace.Member,
              WorkspaceSeatType.Editor
            ),
            assignToWorkspace(
              roleWorkspace,
              workspaceMemberViewer,
              Roles.Workspace.Member,
              WorkspaceSeatType.Viewer
            )
          ])
          await createTestStream(roleProject, serverAdminUser)

          await Promise.all([
            addToStream(roleProject, workspaceGuest, Roles.Stream.Reviewer),
            addToStream(roleProject, workspaceEditor, Roles.Stream.Contributor),
            addToStream(roleProject, workspaceMemberViewer, Roles.Stream.Reviewer)
          ])

          // assert seat types
          const seats = await getWorkspaceUserSeatsFactory({ db })({
            workspaceId: roleWorkspace.id,
            userIds: [workspaceGuest.id, workspaceEditor.id, workspaceMemberViewer.id]
          })
          expect(seats[workspaceGuest.id].type).to.equal(WorkspaceSeatType.Viewer)
          expect(seats[workspaceEditor.id].type).to.equal(WorkspaceSeatType.Editor)
          expect(seats[workspaceMemberViewer.id].type).to.equal(
            WorkspaceSeatType.Viewer
          )
        })

        describeEach(
          [{ oldResolver: true }, { oldResolver: false }],
          ({ oldResolver }) =>
            `with ${oldResolver ? 'old' : 'new'} updateRole resolver`,
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

              expect(res).to.haveGraphQLErrors({ code: WorkspaceInvalidRoleError.code })
              expect(newRole).to.eq(Roles.Stream.Reviewer)
            })

            it(`can${
              oldPlan ? '' : 'not'
            } set a workspace viewer as a project contributor or owner`, async () => {
              const { res: resA } = await updateRole({
                projectId: roleProject.id,
                userId: workspaceMemberViewer.id,
                role: Roles.Stream.Contributor
              })
              const { res: resB } = await updateRole({
                projectId: roleProject.id,
                userId: workspaceMemberViewer.id,
                role: Roles.Stream.Owner
              })
              const newRole = await getUserStreamRole(
                workspaceMemberViewer.id,
                roleProject.id
              )

              if (oldPlan) {
                expect(resA).to.not.haveGraphQLErrors()
                expect(resB).to.not.haveGraphQLErrors()
                expect(newRole).to.eq(Roles.Stream.Owner)
              } else {
                expect(resA).to.haveGraphQLErrors({
                  code: WorkspaceInvalidRoleError.code
                })
                expect(resB).to.haveGraphQLErrors({
                  code: WorkspaceInvalidRoleError.code
                })
                expect(newRole).to.eq(Roles.Stream.Reviewer)
              }
            })
          }
        )
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
    const PAGE_SIZE = 5
    const PAGE_COUNT = 3
    const TOTAL_COUNT = PAGE_COUNT * PAGE_SIZE
    const GUEST_PROJECT_COUNT = PAGE_SIZE + 1

    const queryWorkspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: '',
      name: 'Query Workspace'
    }

    const workspaceGuest: BasicTestUser = {
      id: '',
      email: '',
      name: 'Query Workspace Guest'
    }
    const workspaceAdmin = serverMemberUser
    const workspaceMember: BasicTestUser = {
      id: '',
      email: '',
      name: 'Query Workspace Member'
    }
    let projects: BasicTestStream[]
    let apollo: TestApolloServer

    before(async () => {
      await createTestUsers([workspaceGuest, workspaceMember])
      await createTestWorkspace(queryWorkspace, workspaceAdmin, {
        addPlan: { name: 'team', status: 'valid' }
      })
      await assignToWorkspaces([
        [
          queryWorkspace,
          workspaceGuest,
          Roles.Workspace.Guest,
          WorkspaceSeatType.Editor
        ],
        [queryWorkspace, workspaceMember, Roles.Workspace.Member]
      ])
      projects = times(
        TOTAL_COUNT,
        (i): BasicTestStream => ({
          id: '',
          ownerId: '',
          name: `Query Workspace Project - #${i}`,
          isPublic: false,
          workspaceId: queryWorkspace.id
        })
      )
      await Promise.all(
        projects.map((project) => createTestStream(project, workspaceAdmin))
      )

      // ONLY ADD EXPLICIT PROJECT ASSIGNMENTS TO GUEST
      // CREATE CONCURRENTLY TO TEST COMPOSITE CURSOR (same updatedAt)
      // Assign guest to only first page + 1
      const projectsToAssign = projects.slice(0, GUEST_PROJECT_COUNT)
      await Promise.all(
        projectsToAssign.map((project) =>
          addToStream(project, workspaceGuest, Roles.Stream.Contributor)
        )
      )

      apollo = await testApolloServer({
        authUserId: workspaceAdmin.id
      })
    })

    afterEach(async () => {
      EnvHelperMock.resetMockedFunctions()
    })

    it('should return all projects for workspace members', async () => {
      const res = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: queryWorkspace.id,
        limit: 999 // get everything
      })

      expect(res).to.not.haveGraphQLErrors()
      const collection = res.data?.workspace.projects
      expect(collection?.items.length).to.equal(TOTAL_COUNT)
      expect(collection?.cursor).to.be.ok
      expect(collection?.totalCount).to.eq(TOTAL_COUNT)

      // validate sorting
      const projects = collection?.items || []
      let lastUpdatedAt: Optional<string> = undefined
      for (const project of projects) {
        const date = project.updatedAt
        if (!lastUpdatedAt) {
          lastUpdatedAt = date
          continue
        }
        expect(
          dayjs(date).isSame(dayjs(lastUpdatedAt)) ||
            dayjs(date).isBefore(dayjs(lastUpdatedAt))
        ).to.be.true
        lastUpdatedAt = date
      }
    })

    itEach(
      [{ adminOverrideEnabled: true }, { adminOverrideEnabled: false }],
      ({ adminOverrideEnabled }) =>
        adminOverrideEnabled
          ? 'should return all projects for server admins if override enabled'
          : 'should fail retrieving projects for server admins if no override enabled',
      async ({ adminOverrideEnabled }) => {
        const apollo = await testApolloServer({
          authUserId: serverAdminUser.id
        })

        EnvHelperMock.mockFunction('adminOverrideEnabled', () => adminOverrideEnabled)
        const res = await apollo.execute(GetWorkspaceProjectsDocument, {
          id: queryWorkspace.id,
          limit: 999 // get everything
        })

        if (adminOverrideEnabled) {
          expect(res).to.not.haveGraphQLErrors()
          const collection = res.data?.workspace.projects
          expect(collection?.items.length).to.equal(TOTAL_COUNT)
          expect(collection?.cursor).to.be.ok
          expect(collection?.totalCount).to.eq(TOTAL_COUNT)
        } else {
          expect(res).to.haveGraphQLErrors()
          const collection = res.data?.workspace.projects
          expect(collection).to.not.be.ok
        }
      }
    )

    it('should return only explicitly assigned projects for guests', async () => {
      const apollo = await testApolloServer({
        authUserId: workspaceGuest.id
      })
      const res = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: queryWorkspace.id,
        limit: 999 // get everything
      })

      expect(res).to.not.haveGraphQLErrors()
      const collection = res.data?.workspace.projects
      expect(collection?.items.length).to.equal(GUEST_PROJECT_COUNT)
      expect(collection?.cursor).to.be.ok
      expect(collection?.totalCount).to.equal(GUEST_PROJECT_COUNT)
    })

    it('should respect limits', async () => {
      const res = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: queryWorkspace.id,
        limit: 1
      })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.workspace.projects.items.length).to.equal(1)
      expect(res.data?.workspace.projects.cursor).to.be.ok
      expect(res.data?.workspace.projects.totalCount).to.equal(TOTAL_COUNT)
    })

    it('should only return totalCount if limit === 0', async () => {
      const res = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: queryWorkspace.id,
        limit: 0
      })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.workspace.projects.items.length).to.equal(0)
      expect(res.data?.workspace.projects.cursor).to.be.null
      expect(res.data?.workspace.projects.totalCount).to.equal(TOTAL_COUNT)
    })

    it('should respect pagination', async () => {
      let newCursor: Nullable<string> = null
      for (let page = 1; page <= PAGE_COUNT + 1; page++) {
        const res: ExecuteOperationResponse<GetWorkspaceProjectsQuery> =
          await apollo.execute(GetWorkspaceProjectsDocument, {
            id: queryWorkspace.id,
            limit: PAGE_SIZE,
            cursor: newCursor
          })
        newCursor = res.data?.workspace.projects.cursor || null

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.projects.totalCount).to.equal(TOTAL_COUNT)

        if (page <= PAGE_COUNT) {
          expect(res.data?.workspace.projects.items.length).to.equal(PAGE_SIZE)
          expect(res.data?.workspace.projects.cursor).to.be.ok
        } else {
          expect(res.data?.workspace.projects.items.length).to.eq(0)
          expect(res.data?.workspace.projects.cursor).to.be.null
        }
      }
    })

    it('should respect search filters', async () => {
      const res = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: queryWorkspace.id,
        filter: {
          search: 'Query Workspace Project - #0'
        }
      })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.workspace.projects.items.length).to.equal(1)
      expect(res.data?.workspace.projects.totalCount).to.equal(1)
      expect(res.data?.workspace.projects.cursor).to.be.ok

      const project = res.data?.workspace.projects.items[0]
      expect(project).to.exist
      expect(project?.name).to.equal('Query Workspace Project - #0')
    })
  })

  describe("when querying active user's projects", () => {
    it('should return workspace info on project types', async () => {
      const res = await apollo.execute(ActiveUserProjectsWorkspaceDocument, {})

      const projects = res.data?.activeUser?.projects.items

      expect(res).to.not.haveGraphQLErrors()
      expect(projects).to.exist
      expect(projects?.every((project) => !!project?.workspace?.id)).to.be.ok
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

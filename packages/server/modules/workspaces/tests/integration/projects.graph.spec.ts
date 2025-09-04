import { db } from '@/db/knex'
import { StreamAcl, Streams } from '@/modules/core/dbSchema'
import type { StreamRecord } from '@/modules/core/helpers/types'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import { getWorkspaceUserSeatsFactory } from '@/modules/gatekeeper/repositories/workspaceSeat'
import { getRegionDb } from '@/modules/multiregion/utils/dbSelector'
import { WorkspaceInvalidRoleError } from '@/modules/workspaces/errors/workspace'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  assignToWorkspace,
  assignToWorkspaces,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { describeEach, itEach } from '@/test/assertionHelper'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser, createTestUsers, login } from '@/test/authHelper'
import type {
  GetWorkspaceProjectsQuery,
  ProjectUpdateRoleInput
} from '@/modules/core/graph/generated/graphql'
import {
  ActiveUserProjectsDocument,
  ActiveUserProjectsWorkspaceDocument,
  CreateWorkspaceProjectDocument,
  GetProjectDocument,
  GetWorkspaceDocument,
  GetWorkspaceProjectsDocument,
  GetWorkspaceTeamDocument,
  MoveProjectToWorkspaceDocument,
  ProjectVisibility,
  UpdateProjectDocument,
  UpdateProjectRoleDocument,
  UpdateWorkspaceProjectRoleDocument
} from '@/modules/core/graph/generated/graphql'
import type { ExecuteOperationResponse, TestApolloServer } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { mockAdminOverride } from '@/test/mocks/global'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import {
  addToStream,
  createTestStream,
  getUserStreamRole
} from '@/test/speckle-helpers/streamHelper'
import type { Nullable, Optional } from '@speckle/shared'
import {
  isNonNullable,
  PaidWorkspacePlans,
  Roles,
  WorkspacePlans
} from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import dayjs from 'dayjs'
import type { Knex } from 'knex'
import { times } from 'lodash-es'

const grantStreamPermissions = grantStreamPermissionsFactory({ db })
const adminOverrideMock = mockAdminOverride()

const tables = {
  streams: (db: Knex) => db.table<StreamRecord>(Streams.name)
}

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

  describe('when creating project', () => {
    it('should have workspace visibility by default', async () => {
      const res = await apollo.execute(
        CreateWorkspaceProjectDocument,
        {
          input: {
            name: 'Test Default Project',
            workspaceId: workspace.id
          }
        },
        { assertNoErrors: true }
      )

      const project = res.data?.workspaceMutations?.projects.create
      expect(project).to.be.ok
      expect(project?.visibility).to.equal(ProjectVisibility.Workspace)
    })

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

    describe(`with pro plan`, () => {
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
          addPlan: { name: PaidWorkspacePlans.Pro, status: 'valid' }
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
        expect(seats[workspaceMemberViewer.id].type).to.equal(WorkspaceSeatType.Viewer)
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

            expect(res).to.haveGraphQLErrors({ code: WorkspaceInvalidRoleError.code })
            expect(newRole).to.eq(Roles.Stream.Reviewer)
          })

          it(`can not set a workspace viewer as a project contributor or owner`, async () => {
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

            expect(resA).to.haveGraphQLErrors({
              code: WorkspaceInvalidRoleError.code
            })
            expect(resB).to.haveGraphQLErrors({
              code: WorkspaceInvalidRoleError.code
            })
            expect(newRole).to.eq(Roles.Stream.Reviewer)
          })
        }
      )
    })
  })

  describe('when querying projects', () => {
    const PAGE_SIZE = 5
    const PAGE_COUNT = 3
    const TOTAL_WS_PROJECT_COUNT = PAGE_COUNT * PAGE_SIZE

    const GUEST_PROJECT_COUNT = PAGE_SIZE + 1
    const NON_WORKSPACE_PROJECT_COUNT = 5

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
    const workspaceAdmin2: BasicTestUser = {
      id: '',
      email: '',
      name: 'Query Workspace Admin 2'
    }

    const workspaceMember: BasicTestUser = {
      id: '',
      email: '',
      name: 'Query Workspace Member'
    }
    const workspaceMemberNoExplicitRoles: BasicTestUser = {
      id: '',
      email: '',
      name: 'Query Workspace Member w/ No Explicit Project Roles'
    }

    let wsProjects: BasicTestStream[]
    let nonWorkspaceProjects: BasicTestStream[]
    let apollo: TestApolloServer

    before(async () => {
      await createTestUsers([
        workspaceGuest,
        workspaceMember,
        workspaceAdmin2,
        workspaceMemberNoExplicitRoles
      ])
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
        [
          queryWorkspace,
          workspaceMember,
          Roles.Workspace.Member,
          WorkspaceSeatType.Editor
        ],
        [
          queryWorkspace,
          workspaceAdmin2,
          Roles.Workspace.Admin,
          WorkspaceSeatType.Editor
        ],
        [
          queryWorkspace,
          workspaceMemberNoExplicitRoles,
          Roles.Workspace.Member,
          WorkspaceSeatType.Editor
        ]
      ])
      wsProjects = times(
        TOTAL_WS_PROJECT_COUNT,
        (i): BasicTestStream => ({
          id: '',
          ownerId: '',
          name: `Query Workspace Project - #${i}`,
          // Make all except the very last one workspace visibility
          visibility:
            i === TOTAL_WS_PROJECT_COUNT - 1
              ? ProjectRecordVisibility.Private
              : ProjectRecordVisibility.Workspace,
          workspaceId: queryWorkspace.id
        })
      )
      nonWorkspaceProjects = times(
        NON_WORKSPACE_PROJECT_COUNT,
        (i): BasicTestStream => ({
          id: '',
          ownerId: '',
          name: `Non Workspace Project - #${i}`,
          visibility: ProjectRecordVisibility.Private
        })
      )

      // CREATE CONCURRENTLY TO TEST COMPOSITE CURSOR (same updatedAt)
      await Promise.all([
        ...wsProjects.map((project) => createTestStream(project, workspaceAdmin)),
        ...nonWorkspaceProjects.map((project) =>
          createTestStream(project, workspaceGuest)
        )
      ])

      // ONLY ADD EXPLICIT PROJECT ASSIGNMENTS TO GUEST
      const projectsToAssign = wsProjects.slice(0, GUEST_PROJECT_COUNT)
      await Promise.all(
        projectsToAssign.map((project) =>
          addToStream(project, workspaceGuest, Roles.Stream.Contributor)
        )
      )

      await Promise.all([
        // Add explicit single assignment to workspaceMember & workspaceAdmin to 1st non-workspace project
        addToStream(nonWorkspaceProjects[0], workspaceMember, Roles.Stream.Contributor),
        addToStream(nonWorkspaceProjects[0], workspaceAdmin, Roles.Stream.Contributor),
        // Add explicit single assignment to workspaceMember to 1st workspace project
        addToStream(wsProjects[0], workspaceMember, Roles.Stream.Contributor)
      ])

      apollo = await testApolloServer({
        authUserId: workspaceAdmin.id
      })
    })

    // projects at the end have no explicit project assignments (and very last one is fully private),
    // and first X ones are explicitly assigned to guest user
    const implicitPrivateProject = () => wsProjects.at(-1)!
    const implicitWorkspaceVisibilityProject = () => wsProjects.at(-2)!
    const explicitGuestProject = () => wsProjects.at(0)!

    afterEach(async () => {
      adminOverrideMock.disable()
    })

    describe('through Workspace.projects', () => {
      it('should return all projects for workspace admin', async () => {
        const res = await apollo.execute(GetWorkspaceProjectsDocument, {
          id: queryWorkspace.id,
          limit: 999 // get everything
        })

        expect(res).to.not.haveGraphQLErrors()
        const collection = res.data?.workspace.projects
        expect(collection?.items.length).to.equal(TOTAL_WS_PROJECT_COUNT)
        expect(collection?.cursor).to.be.ok
        expect(collection?.totalCount).to.eq(TOTAL_WS_PROJECT_COUNT)

        // validate sorting
        const projects = collection?.items || []
        let lastUpdatedAt: Optional<Date> = undefined
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

          adminOverrideMock.enable(adminOverrideEnabled)
          const res = await apollo.execute(GetWorkspaceProjectsDocument, {
            id: queryWorkspace.id,
            limit: 999 // get everything
          })

          if (adminOverrideEnabled) {
            expect(res).to.not.haveGraphQLErrors()
            const collection = res.data?.workspace.projects
            expect(collection?.items.length).to.equal(TOTAL_WS_PROJECT_COUNT)
            expect(collection?.cursor).to.be.ok
            expect(collection?.totalCount).to.eq(TOTAL_WS_PROJECT_COUNT)
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

      it('should return all non-private for members who may not even have any explicit project roles', async () => {
        const apollo = await testApolloServer({
          authUserId: workspaceMemberNoExplicitRoles.id
        })
        const res = await apollo.execute(GetWorkspaceProjectsDocument, {
          id: queryWorkspace.id,
          limit: 999 // get everything
        })

        const nonPrivateCount = TOTAL_WS_PROJECT_COUNT - 1 // -1 for the fully private one

        expect(res).to.not.haveGraphQLErrors()
        const collection = res.data?.workspace.projects
        expect(collection?.items.length).to.equal(nonPrivateCount)
        expect(collection?.cursor).to.be.ok
        expect(collection?.totalCount).to.equal(nonPrivateCount)
      })

      it('should respect limits', async () => {
        const res = await apollo.execute(GetWorkspaceProjectsDocument, {
          id: queryWorkspace.id,
          limit: 1
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.projects.items.length).to.equal(1)
        expect(res.data?.workspace.projects.cursor).to.be.ok
        expect(res.data?.workspace.projects.totalCount).to.equal(TOTAL_WS_PROJECT_COUNT)
      })

      it('should only return totalCount if limit === 0', async () => {
        const res = await apollo.execute(GetWorkspaceProjectsDocument, {
          id: queryWorkspace.id,
          limit: 0
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.projects.items.length).to.equal(0)
        expect(res.data?.workspace.projects.cursor).to.be.null
        expect(res.data?.workspace.projects.totalCount).to.equal(TOTAL_WS_PROJECT_COUNT)
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
          expect(res.data?.workspace.projects.totalCount).to.equal(
            TOTAL_WS_PROJECT_COUNT
          )

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

      it('should respect withProjectRoleOnly flag', async () => {
        const apollo = await testApolloServer({
          authUserId: workspaceMember.id
        })
        const res = await apollo.execute(GetWorkspaceProjectsDocument, {
          id: queryWorkspace.id,
          filter: {
            withProjectRoleOnly: true
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        const collection = res.data?.workspace.projects
        expect(collection).to.be.ok
        expect(collection?.items.length).to.equal(1)
        expect(collection?.items[0].id).to.equal(wsProjects[0].id)
        expect(collection?.totalCount).to.equal(1)
      })
    })

    describe('for a specific one', () => {
      const randomServerGuy: BasicTestUser = {
        id: '',
        name: 'Random Server Guy',
        email: ''
      }

      before(async () => {
        await createTestUser(randomServerGuy)
      })

      it('workspace visibility should be accessible to workspace member', async () => {
        const apollo = await testApolloServer({
          authUserId: workspaceMember.id
        })
        const res = await apollo.execute(GetProjectDocument, {
          id: implicitWorkspaceVisibilityProject().id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.project.id).to.be.ok
      })

      it('private visibility should not be accessible to workspace member w/o explicit role', async () => {
        const apollo = await testApolloServer({
          authUserId: workspaceMember.id
        })
        const res = await apollo.execute(GetProjectDocument, {
          id: implicitPrivateProject().id
        })

        expect(res).to.haveGraphQLErrors()
        expect(res.data?.project).to.not.be.ok
      })

      it('private visibility should be accessible to workspace admin w/o explicit role', async () => {
        const apollo = await testApolloServer({
          authUserId: workspaceAdmin2.id
        })
        const res = await apollo.execute(GetProjectDocument, {
          id: implicitPrivateProject().id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.project.id).to.be.ok
      })

      it('it should not be accessible to random outside workspace guy', async () => {
        const apollo = await testApolloServer({
          authUserId: randomServerGuy.id
        })
        const res = await apollo.execute(GetProjectDocument, {
          id: implicitWorkspaceVisibilityProject().id
        })

        expect(res).to.haveGraphQLErrors()
        expect(res.data?.project).to.not.be.ok
      })

      itEach(
        [{ explicit: false }, { explicit: true }],
        ({ explicit }) =>
          explicit
            ? 'it should be accessible to workspace guest with explicit project role'
            : 'it should not be accessible to workspace guest without explicit project role',
        async ({ explicit }) => {
          const apollo = await testApolloServer({
            authUserId: workspaceGuest.id
          })
          const res = await apollo.execute(GetProjectDocument, {
            id: explicit
              ? explicitGuestProject().id
              : implicitWorkspaceVisibilityProject().id
          })

          if (explicit) {
            expect(res).to.not.haveGraphQLErrors()
            expect(res.data?.project.id).to.be.ok
          } else {
            expect(res).to.haveGraphQLErrors()
            expect(res.data?.project).to.not.be.ok
          }
        }
      )

      itEach(
        [{ adminOverrideEnabled: true }, { adminOverrideEnabled: false }],
        ({ adminOverrideEnabled }) =>
          adminOverrideEnabled
            ? 'it should return fully private project for server admins if override enabled'
            : 'it should not return fully private project for server admins if override disabled',
        async ({ adminOverrideEnabled }) => {
          const apollo = await testApolloServer({
            authUserId: serverAdminUser.id
          })

          adminOverrideMock.enable(adminOverrideEnabled)
          const res = await apollo.execute(GetProjectDocument, {
            id: implicitPrivateProject().id
          })

          if (adminOverrideEnabled) {
            expect(res).to.not.haveGraphQLErrors()
            expect(res.data?.project.id).to.be.ok
          } else {
            expect(res).to.haveGraphQLErrors()
            expect(res.data?.project).to.not.be.ok
          }
        }
      )
    })

    describe('through ActiveUser.projects', () => {
      let apollo: TestApolloServer

      before(async () => {
        apollo = await testApolloServer({
          authUserId: workspaceGuest.id
        })
      })

      it('should return all projects user is explicitly assigned to', async () => {
        // guest
        const apolloGuest = await testApolloServer({
          authUserId: workspaceGuest.id
        })
        const guestRes = await apolloGuest.execute(
          ActiveUserProjectsWorkspaceDocument,
          { limit: 999 },
          { assertNoErrors: true }
        )

        const guestCollection = guestRes.data?.activeUser?.projects
        const expectedGuestCount = GUEST_PROJECT_COUNT + NON_WORKSPACE_PROJECT_COUNT
        expect(guestCollection).to.be.ok
        expect(guestCollection!.totalCount).to.equal(expectedGuestCount)
        expect(guestCollection!.items.length).to.equal(expectedGuestCount)
        expect(
          guestCollection!.items.map((i) => i.workspace?.id).filter(isNonNullable)
        ).to.have.length(GUEST_PROJECT_COUNT)

        // member
        const apolloMember = await testApolloServer({
          authUserId: workspaceMember.id
        })
        const memberRes = await apolloMember.execute(
          ActiveUserProjectsWorkspaceDocument,
          { limit: 999 },
          { assertNoErrors: true }
        )
        const memberCollection = memberRes.data?.activeUser?.projects
        const expectedMemberCount = 2 // only 2 explicit assignments
        expect(memberCollection).to.be.ok
        expect(memberCollection!.totalCount).to.equal(expectedMemberCount)
        expect(memberCollection!.items.length).to.equal(expectedMemberCount)
        expect([
          memberCollection!.items[0].id,
          memberCollection!.items[1].id
        ]).to.deep.equalInAnyOrder([nonWorkspaceProjects[0].id, wsProjects[0].id])
      })

      itEach(
        [{ admin: true }, { admin: false }],
        ({ admin }) =>
          `should return all projects ${
            admin ? 'ws admin' : 'ws member'
          } is explicitly or implicitly assigned to, if flag set`,
        async ({ admin }) => {
          const apollo = await testApolloServer({
            authUserId: admin ? workspaceAdmin.id : workspaceMember.id
          })
          const res = await apollo.execute(
            ActiveUserProjectsWorkspaceDocument,
            { limit: 999, filter: { includeImplicitAccess: true } },
            { assertNoErrors: true }
          )
          const projects = res.data?.activeUser?.projects

          // 1 non-workspace assignment + all workspace projects
          // (except the last one thats fully private, if not admin)
          let expectedCount = TOTAL_WS_PROJECT_COUNT + 1
          if (!admin) {
            expectedCount -= 1
          }

          expect(projects).to.be.ok
          expect(projects!.totalCount).to.equal(expectedCount)
          expect(projects!.items.length).to.equal(expectedCount)
          expect(projects!.items.map((i) => i.id)).to.deep.equalInAnyOrder([
            nonWorkspaceProjects[0].id,
            ...wsProjects
              .filter((p) => (admin ? true : p.id !== implicitPrivateProject().id))
              .map((p) => p.id)
          ])
        }
      )

      it('should only return workspace projects if filter set', async () => {
        const res = await apollo.execute(ActiveUserProjectsWorkspaceDocument, {
          filter: {
            workspaceId: queryWorkspace.id
          },
          limit: 999
        })

        const expectedCount = GUEST_PROJECT_COUNT
        expect(res).to.not.haveGraphQLErrors()
        const collection = res.data?.activeUser?.projects
        expect(collection).to.be.ok
        expect(collection?.items.length).to.equal(expectedCount)
        expect(collection?.totalCount).to.equal(expectedCount)
        expect(
          collection?.items.map((i) => i.workspace?.id).filter(isNonNullable)
        ).to.have.length(expectedCount)
      })

      it('should only return non-workspace projects if filter set', async () => {
        const res = await apollo.execute(ActiveUserProjectsWorkspaceDocument, {
          filter: {
            personalOnly: true
          },
          limit: 999
        })

        const expectedCount = NON_WORKSPACE_PROJECT_COUNT
        expect(res).to.not.haveGraphQLErrors()
        const collection = res.data?.activeUser?.projects
        expect(collection).to.be.ok
        expect(collection?.items.length).to.equal(expectedCount)
        expect(collection?.totalCount).to.equal(expectedCount)
        expect(
          collection?.items.map((i) => i.workspace?.id).filter((v) => !v)
        ).to.have.length(expectedCount)
      })
    })
  })

  describe('when moving a project to a workspace', () => {
    const testProject: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Test Project',
      visibility: ProjectRecordVisibility.Private
    }

    const targetWorkspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: cryptoRandomString({ length: 10 }),
      name: 'Target Workspace'
    }

    before(async () => {
      await createTestWorkspace(targetWorkspace, serverAdminUser, {
        addPlan: WorkspacePlans.Unlimited
      })
    })

    beforeEach(async () => {
      await createTestStream(testProject, serverAdminUser)
      await grantStreamPermissions({
        streamId: testProject.id,
        userId: serverMemberUser.id,
        role: Roles.Stream.Contributor
      })
    })

    it('should move the project to the target workspace and update visibility', async () => {
      const res = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: testProject.id,
        workspaceId: targetWorkspace.id
      })

      const project = res.data?.workspaceMutations.projects.moveToWorkspace

      expect(res).to.not.haveGraphQLErrors()
      expect(project?.workspaceId).to.equal(targetWorkspace.id)
      expect(project?.visibility).to.equal(ProjectVisibility.Workspace)
    })

    it('should move a public project to the target workspace and keep same visibility', async () => {
      const publicProject: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'Test Public Project',
        visibility: ProjectRecordVisibility.Public
      }
      await createTestStream(publicProject, serverAdminUser)

      const res = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: publicProject.id,
        workspaceId: targetWorkspace.id
      })

      const project = res.data?.workspaceMutations.projects.moveToWorkspace

      expect(res).to.not.haveGraphQLErrors()
      expect(project?.workspaceId).to.equal(targetWorkspace.id)
      expect(project?.visibility).to.equal(ProjectVisibility.Public)
    })

    it('should preserve project roles for project members with editor seats', async () => {
      const res = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: testProject.id,
        workspaceId: targetWorkspace.id
      })

      const { team } = res.data?.workspaceMutations.projects.moveToWorkspace ?? {}

      const adminProjectRole = team?.find((role) => role.id === serverAdminUser.id)

      expect(res).to.not.haveGraphQLErrors()
      expect(adminProjectRole?.role).to.equal(Roles.Stream.Owner)
    })

    it('should demote users with editor project roles and workspace viewer seats', async () => {
      const res = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: testProject.id,
        workspaceId: targetWorkspace.id
      })

      const { team } = res.data?.workspaceMutations.projects.moveToWorkspace ?? {}

      const memberProjectRole = team?.find((role) => role.id === serverMemberUser.id)

      expect(res).to.not.haveGraphQLErrors()
      expect(memberProjectRole?.role).to.equal(Roles.Stream.Reviewer)
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

    isMultiRegionTestMode()
      ? describe('when the default server db region is not the main db @multiregion', () => {
          const regionalProject: StreamRecord = {
            id: cryptoRandomString({ length: 9 }),
            name: 'My Special Project',
            description: null,
            clonedFrom: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            allowPublicComments: false,
            workspaceId: null,
            regionKey: 'region1',
            visibility: ProjectRecordVisibility.Public
          }

          before(async () => {
            // Simulate non-main default db region
            await createTestStream(regionalProject, serverAdminUser)
          })

          it('should be located in the correct region', async () => {
            const regionDb = await getRegionDb({ regionKey: 'region1' })
            await tables.streams(regionDb).insert(regionalProject)
            await grantStreamPermissions({
              streamId: regionalProject.id,
              userId: serverAdminUser.id,
              role: Roles.Stream.Owner
            })
          })

          it('should update project without removing workspace association @multiregion', async () => {
            const resA = await apollo.execute(MoveProjectToWorkspaceDocument, {
              projectId: regionalProject.id,
              workspaceId: targetWorkspace.id
            })
            const resB = await apollo.execute(UpdateProjectDocument, {
              input: {
                id: regionalProject.id,
                name: 'Foo'
              }
            })
            const resC = await apollo.execute(GetProjectDocument, {
              id: regionalProject.id
            })

            expect(resA).to.not.haveGraphQLErrors()
            expect(resB).to.not.haveGraphQLErrors()
            expect(resC).to.not.haveGraphQLErrors()
            expect(resC.data?.project?.workspaceId).to.equal(targetWorkspace.id)
          })
        })
      : null
  })

  // moved over Alessandro's tests from core to here, since they are all related to workspaces
  // they're kind of a mess and need to be cleaned up
  describe('query user.projects', () => {
    it('should return projects not in a workspace', async () => {
      const testAdminUser: BasicTestUser = {
        id: '',
        name: 'test',
        email: '',
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

      // create w/o GQL, to not mess w/ personal project limits
      const projectNonInWorkspace: BasicTestStream = {
        id: '',
        name: 'project',
        ownerId: '',
        isPublic: false
      }
      await createTestStream(projectNonInWorkspace, testAdminUser)

      const userProjectsRes = await session.execute(ActiveUserProjectsDocument, {
        filter: { personalOnly: true }
      })
      expect(userProjectsRes).to.not.haveGraphQLErrors()

      const projects = userProjectsRes.data!.activeUser!.projects.items

      expect(projects).to.have.length(1)
      expect(projects[0].id).to.eq(projectNonInWorkspace.id)
    })

    it('should return projects in workspace', async () => {
      const testAdminUser: BasicTestUser = {
        id: '',
        name: 'test',
        email: '',
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

      // create w/o GQL, to not mess w/ personal project limits
      const projectNonInWorkspace: BasicTestStream = {
        id: '',
        name: 'project',
        ownerId: '',
        isPublic: false
      }
      await createTestStream(projectNonInWorkspace, testAdminUser)

      const userProjectsRes = await session.execute(ActiveUserProjectsDocument, {
        filter: { workspaceId }
      })
      expect(userProjectsRes).to.not.haveGraphQLErrors()

      const projects = userProjectsRes.data!.activeUser!.projects.items

      expect(projects).to.have.length(1)
      expect(projects[0].id).to.eq(projectInWorkspace.id)
    })

    it('should return all user projects', async () => {
      const testAdminUser: BasicTestUser = {
        id: '',
        name: 'test',
        email: '',
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

      // create w/o GQL, to not mess w/ personal project limits
      const projectNonInWorkspace: BasicTestStream = {
        id: '',
        name: 'project',
        ownerId: '',
        isPublic: false
      }
      await createTestStream(projectNonInWorkspace, testAdminUser)

      const userProjectsRes = await session.execute(ActiveUserProjectsDocument, {
        filter: {}
      })
      expect(userProjectsRes).to.not.haveGraphQLErrors()

      const projects = userProjectsRes.data!.activeUser!.projects.items

      expect(projects).to.have.length(2)
    })

    it('should return all user projects sorted by user role', async () => {
      const testAdminUser: BasicTestUser = {
        id: '',
        name: 'test',
        email: '',
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
    })
  })
})

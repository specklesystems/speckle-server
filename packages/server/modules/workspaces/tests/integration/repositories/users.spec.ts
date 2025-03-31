import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { getInvitableCollaboratorsByProjectIdFactory } from '@/modules/workspaces/repositories/users'
import {
  assignToWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { createTestUser } from '@/test/authHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import { pick } from 'lodash'

describe('Workspace repositories', () => {
  describe.only('users repository', () => {
    describe('getInvitableCollaboratorsByProjectIdFactory returns a function that ', () => {
      const getInvitableCollaboratorsByProjectId =
        getInvitableCollaboratorsByProjectIdFactory({ db })

      it('should return all workspace collaborators not members of the project', async () => {
        const admin = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        const workspace = {
          id: createRandomString(),
          name: createRandomString(),
          slug: createRandomString(),
          ownerId: admin.id
        }
        await createTestWorkspace(workspace, admin)

        const member = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(workspace, member, Roles.Workspace.Member)

        // Non workspace member
        await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })

        const projectMember = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })

        const project = {
          id: createRandomString(),
          workspaceId: workspace.id
        }
        await createTestStream(project, projectMember)

        // User in another project should still be invitable
        const otherProject = {
          id: createRandomString(),
          workspaceId: workspace.id
        }
        await createTestStream(otherProject, admin)

        const invitable = await getInvitableCollaboratorsByProjectId({
          filter: {
            workspaceId: workspace.id,
            projectId: project.id
          },
          limit: 10
        })
        expect(invitable).to.have.length(2)
        expect(invitable.map((i) => pick(i, ['id', 'name']))).to.deep.equalInAnyOrder([
          { id: admin.id, name: admin.name },
          { id: member.id, name: member.name }
        ])
      })
      it('should should filter by user name', async () => {
        const admin = await createTestUser({
          name: createRandomString() + 'fixed' + createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        const workspace = {
          id: createRandomString(),
          name: createRandomString(),
          slug: createRandomString(),
          ownerId: admin.id
        }
        await createTestWorkspace(workspace, admin)

        const member = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(workspace, member, Roles.Workspace.Member)

        // Non workspace member
        await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })

        const projectMember = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })

        const project = {
          id: createRandomString(),
          workspaceId: workspace.id
        }
        await createTestStream(project, projectMember)

        // User in another project should still be invitable
        const otherProject = {
          id: createRandomString(),
          workspaceId: workspace.id
        }
        await createTestStream(otherProject, admin)

        const invitable = await getInvitableCollaboratorsByProjectId({
          filter: {
            workspaceId: workspace.id,
            projectId: project.id,
            search: 'fixed'
          },
          limit: 10
        })
        expect(invitable).to.have.length(1)
        expect(invitable.map((i) => pick(i, ['id', 'name']))).to.deep.equalInAnyOrder([
          { id: admin.id, name: admin.name }
        ])
      })
      it('should should filter by user email', async () => {
        const admin = await createTestUser({
          name: createRandomString(),
          email: createRandomString() + 'fixed' + createRandomString(),
          role: Roles.Server.User,
          verified: true
        })
        const workspace = {
          id: createRandomString(),
          name: createRandomString(),
          slug: createRandomString(),
          ownerId: admin.id
        }
        await createTestWorkspace(workspace, admin)

        const member = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(workspace, member, Roles.Workspace.Member)

        // Non workspace member
        await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })

        const projectMember = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })

        const project = {
          id: createRandomString(),
          workspaceId: workspace.id
        }
        await createTestStream(project, projectMember)

        // User in another project should still be invitable
        const otherProject = {
          id: createRandomString(),
          workspaceId: workspace.id
        }
        await createTestStream(otherProject, admin)

        const invitable = await getInvitableCollaboratorsByProjectId({
          filter: {
            workspaceId: workspace.id,
            projectId: project.id,
            search: 'fixed'
          },
          limit: 10
        })
        expect(invitable).to.have.length(1)
        expect(invitable.map((i) => pick(i, ['id', 'name']))).to.deep.equalInAnyOrder([
          { id: admin.id, name: admin.name }
        ])
      })
      it('should should filter by user name and email', async () => {
        const admin = await createTestUser({
          name: createRandomString(),
          email: createRandomString() + 'fixed' + createRandomString(),
          role: Roles.Server.User,
          verified: true
        })
        const workspace = {
          id: createRandomString(),
          name: createRandomString(),
          slug: createRandomString(),
          ownerId: admin.id
        }
        await createTestWorkspace(workspace, admin)

        const member = await createTestUser({
          name: createRandomString() + 'fixed' + createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(workspace, member, Roles.Workspace.Member)

        // Non workspace member
        await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })

        const projectMember = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })

        const project = {
          id: createRandomString(),
          workspaceId: workspace.id
        }
        await createTestStream(project, projectMember)

        // User in another project should still be invitable
        const otherProject = {
          id: createRandomString(),
          workspaceId: workspace.id
        }
        await createTestStream(otherProject, admin)

        const invitable = await getInvitableCollaboratorsByProjectId({
          filter: {
            workspaceId: workspace.id,
            projectId: project.id,
            search: 'fixed'
          },
          limit: 10
        })
        expect(invitable).to.have.length(2)
        expect(invitable.map((i) => pick(i, ['id', 'name']))).to.deep.equalInAnyOrder([
          { id: admin.id, name: admin.name },
          { id: member.id, name: member.name }
        ])
      })
    })
  })
})

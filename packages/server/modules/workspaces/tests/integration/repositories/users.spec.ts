import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { getInvitableCollaboratorsByProjectIdFactory } from '@/modules/workspaces/repositories/users'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  assignToWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser, createTestUsers } from '@/test/authHelper'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'
import { pick } from 'lodash-es'

describe('Workspace repositories', () => {
  describe('users repository', () => {
    describe('getInvitableCollaboratorsByProjectIdFactory returns a function, that', () => {
      const getInvitableCollaboratorsByProjectId =
        getInvitableCollaboratorsByProjectIdFactory({ db })

      const adminUser: BasicTestUser = {
        id: '',
        name: createRandomString(),
        email: createRandomEmail()
      }
      const workspaceMemberA: BasicTestUser = {
        id: '',
        name: createRandomString() + 'foo',
        email: 'baz' + createRandomEmail()
      }
      const workspaceMemberB: BasicTestUser = {
        id: '',
        name: createRandomString() + 'baz',
        email: 'bar' + createRandomEmail()
      }
      const nonWorkspaceMember: BasicTestUser = {
        id: '',
        name: createRandomString(),
        email: createRandomEmail()
      }

      const testWorkspace: BasicTestWorkspace = {
        id: createRandomString(),
        name: createRandomString(),
        slug: createRandomString(),
        ownerId: ''
      }

      // The project we will run the test suite search against
      const testProject: BasicTestStream = {
        id: '',
        ownerId: '',
        name: createRandomString(),
        isPublic: true,
        workspaceId: ''
      }
      // An extra project for test comprehensiveness
      const testOtherProject: BasicTestStream = {
        id: '',
        ownerId: '',
        name: createRandomString(),
        isPublic: true,
        workspaceId: ''
      }

      before(async () => {
        await createTestUser(adminUser)
        await createTestUsers([workspaceMemberA, workspaceMemberB, nonWorkspaceMember])

        await createTestWorkspace(testWorkspace, adminUser, {
          addPlan: {
            name: 'unlimited',
            status: 'valid'
          }
        })
        await assignToWorkspace(testWorkspace, workspaceMemberA)
        await assignToWorkspace(testWorkspace, workspaceMemberB)

        testProject.workspaceId = testWorkspace.id
        testOtherProject.workspaceId = testWorkspace.id

        await createTestStream(testProject, adminUser)
        await createTestStream(testOtherProject, workspaceMemberA)
      })

      it('should return all workspace collaborators not members of the project', async () => {
        const { items: invitable } = await getInvitableCollaboratorsByProjectId({
          filter: {
            workspaceId: testWorkspace.id,
            projectId: testProject.id
          },
          limit: 10
        })
        expect(invitable).to.have.length(2)
        expect(invitable.map((i) => pick(i, ['id', 'name']))).to.deep.equalInAnyOrder([
          { id: workspaceMemberA.id, name: workspaceMemberA.name },
          { id: workspaceMemberB.id, name: workspaceMemberB.name }
        ])
      })
      it('should should filter by user name', async () => {
        const { items: invitable } = await getInvitableCollaboratorsByProjectId({
          filter: {
            workspaceId: testWorkspace.id,
            projectId: testProject.id,
            search: 'foo'
          },
          limit: 10
        })
        expect(invitable).to.have.length(1)
        expect(invitable.map((i) => pick(i, ['id', 'name']))).to.deep.equalInAnyOrder([
          { id: workspaceMemberA.id, name: workspaceMemberA.name }
        ])
      })
      it('should should filter by user email', async () => {
        const { items: invitable } = await getInvitableCollaboratorsByProjectId({
          filter: {
            workspaceId: testWorkspace.id,
            projectId: testProject.id,
            search: 'bar'
          },
          limit: 10
        })
        expect(invitable).to.have.length(1)
        expect(invitable.map((i) => pick(i, ['id', 'name']))).to.deep.equalInAnyOrder([
          { id: workspaceMemberB.id, name: workspaceMemberB.name }
        ])
      })
      it('should should filter by user name and email', async () => {
        const { items: invitable } = await getInvitableCollaboratorsByProjectId({
          filter: {
            workspaceId: testWorkspace.id,
            projectId: testProject.id,
            search: 'baz'
          },
          limit: 10
        })
        expect(invitable).to.have.length(2)
        expect(invitable.map((i) => pick(i, ['id', 'name']))).to.deep.equalInAnyOrder([
          { id: workspaceMemberA.id, name: workspaceMemberA.name },
          { id: workspaceMemberB.id, name: workspaceMemberB.name }
        ])
      })
    })
  })
})

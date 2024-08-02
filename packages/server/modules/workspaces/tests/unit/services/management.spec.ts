import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import {
  createWorkspaceFactory,
  deleteWorkspaceRoleFactory,
  updateWorkspaceRoleFactory
} from '@/modules/workspaces/services/management'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { expectToThrow } from '@/test/assertionHelper'

type WorkspaceTestContext = {
  storedWorkspaces: Workspace[]
  storedRoles: WorkspaceAcl[]
  eventData: {
    isCalled: boolean
    eventName: string
    payload: unknown
  }
}

const buildCreateWorkspaceWithTestContext = (
  dependecyOverrides: Partial<Parameters<typeof createWorkspaceFactory>[0]> = {}
) => {
  const context: WorkspaceTestContext = {
    storedWorkspaces: [],
    storedRoles: [],
    eventData: {
      isCalled: false,
      eventName: '',
      payload: {}
    }
  }

  const deps: Parameters<typeof createWorkspaceFactory>[0] = {
    upsertWorkspace: async ({ workspace }: { workspace: Workspace }) => {
      context.storedWorkspaces.push(workspace)
    },
    upsertWorkspaceRole: async (workspaceAcl: WorkspaceAcl) => {
      context.storedRoles.push(workspaceAcl)
    },
    emitWorkspaceEvent: async ({ eventName, payload }) => {
      context.eventData.isCalled = true
      context.eventData.eventName = eventName
      context.eventData.payload = payload
      return []
    },
    storeBlob: async () => cryptoRandomString({ length: 10 }),
    ...dependecyOverrides
  }

  const createWorkspace = createWorkspaceFactory(deps)

  return { context, createWorkspace }
}

const getCreateWorkspaceInput = () => {
  return {
    userId: cryptoRandomString({ length: 10 }),
    workspaceInput: {
      description: 'foobar',
      logoUrl: null,
      name: cryptoRandomString({ length: 6 })
    }
  }
}

describe('Workspace services', () => {
  describe('createWorkspaceFactory creates a function, that', () => {
    it('stores the workspace', async () => {
      const { context, createWorkspace } = buildCreateWorkspaceWithTestContext()

      const { userId, workspaceInput } = getCreateWorkspaceInput()
      const workspace = await createWorkspace({
        userId,
        workspaceInput,
        userResourceAccessLimits: null
      })

      expect(context.storedWorkspaces.length).to.equal(1)
      expect(context.storedWorkspaces[0]).to.deep.equal(workspace)
    })
    it('makes the workspace creator becomes a workspace:admin', async () => {
      const { context, createWorkspace } = buildCreateWorkspaceWithTestContext()

      const { userId, workspaceInput } = getCreateWorkspaceInput()
      const workspace = await createWorkspace({
        userId,
        workspaceInput,
        userResourceAccessLimits: null
      })

      expect(context.storedRoles.length).to.equal(1)
      expect(context.storedRoles[0]).to.deep.equal({
        userId,
        workspaceId: workspace.id,
        role: Roles.Workspace.Admin
      })
    })
    it('emits a workspace created event', async () => {
      const { context, createWorkspace } = buildCreateWorkspaceWithTestContext()

      const { userId, workspaceInput } = getCreateWorkspaceInput()
      const workspace = await createWorkspace({
        userId,
        workspaceInput,
        userResourceAccessLimits: null
      })

      expect(context.eventData.isCalled).to.equal(true)
      expect(context.eventData.eventName).to.equal(WorkspaceEvents.Created)
      expect(context.eventData.payload).to.deep.equal({
        ...workspace,
        createdByUserId: userId
      })
    })
  })
})

type WorkspaceRoleTestContext = {
  workspaceId: string
  workspaceRoles: WorkspaceAcl[]
  workspaceProjects: StreamRecord[]
  workspaceProjectRoles: StreamAclRecord[]
  eventData: {
    isCalled: boolean
    eventName: string
    payload: unknown
  }
}

const getDefaultWorkspaceRoleTestContext = (): WorkspaceRoleTestContext => {
  return {
    workspaceId: cryptoRandomString({ length: 10 }),
    workspaceRoles: [],
    workspaceProjects: [],
    workspaceProjectRoles: [],
    eventData: {
      isCalled: false,
      eventName: '',
      payload: {}
    }
  }
}

const buildDeleteWorkspaceRoleAndTestContext = (
  contextOverrides: Partial<WorkspaceRoleTestContext> = {},
  dependencyOverrides: Partial<Parameters<typeof deleteWorkspaceRoleFactory>[0]> = {}
) => {
  const context: WorkspaceRoleTestContext = {
    ...getDefaultWorkspaceRoleTestContext(),
    ...contextOverrides
  }

  const deps: Parameters<typeof deleteWorkspaceRoleFactory>[0] = {
    getWorkspaceRoles: async () => context.workspaceRoles,
    deleteWorkspaceRole: async (role) => {
      const isMatch = (acl: WorkspaceAcl): boolean => {
        return acl.workspaceId === role.workspaceId && acl.userId === role.userId
      }

      const deletedRoleIndex = context.workspaceRoles.findIndex(isMatch)

      if (deletedRoleIndex < 0) {
        return null
      }

      const deletedRole = structuredClone(context.workspaceRoles[deletedRoleIndex])

      context.workspaceRoles = context.workspaceRoles.filter((acl) => !isMatch(acl))

      return deletedRole
    },
    emitWorkspaceEvent: async ({ eventName, payload }) => {
      context.eventData.isCalled = true
      context.eventData.eventName = eventName
      context.eventData.payload = payload

      return []
    },
    getStreams: async () => ({
      streams: context.workspaceProjects,
      totalCount: context.workspaceProjects.length,
      cursorDate: null
    }),
    revokeStreamPermissions: async ({ streamId, userId }) => {
      context.workspaceProjectRoles = context.workspaceProjectRoles.filter(
        (role) => role.resourceId !== streamId && role.userId !== userId
      )
      return {} as StreamRecord
    },
    ...dependencyOverrides
  }

  const deleteWorkspaceRole = deleteWorkspaceRoleFactory(deps)

  return { deleteWorkspaceRole, context }
}

const buildUpdateWorkspaceRoleAndTestContext = (
  contextOverrides: Partial<WorkspaceRoleTestContext> = {},
  dependencyOverrides: Partial<Parameters<typeof updateWorkspaceRoleFactory>[0]> = {}
) => {
  const context = {
    ...getDefaultWorkspaceRoleTestContext(),
    ...contextOverrides
  }

  const deps: Parameters<typeof updateWorkspaceRoleFactory>[0] = {
    getWorkspaceRoles: async () => context.workspaceRoles,
    upsertWorkspaceRole: async (role) => {
      const currentRoleIndex = context.workspaceRoles.findIndex(
        (acl) => acl.userId === role.userId && acl.workspaceId === role.workspaceId
      )

      if (currentRoleIndex >= 0) {
        context.workspaceRoles[currentRoleIndex] = role
      } else {
        context.workspaceRoles.push(role)
      }
    },
    emitWorkspaceEvent: async ({ eventName, payload }) => {
      context.eventData.isCalled = true
      context.eventData.eventName = eventName
      context.eventData.payload = payload

      return []
    },
    getStreams: async () => ({
      streams: context.workspaceProjects,
      totalCount: context.workspaceProjects.length,
      cursorDate: null
    }),
    grantStreamPermissions: async (role) => {
      const currentRoleIndex = context.workspaceProjectRoles.findIndex(
        (acl) => acl.userId === role.userId && acl.resourceId === role.streamId
      )

      const streamAcl: StreamAclRecord = {
        userId: role.userId,
        role: role.role,
        resourceId: role.streamId
      }

      if (currentRoleIndex > 0) {
        context.workspaceProjectRoles[currentRoleIndex] = streamAcl
      } else {
        context.workspaceProjectRoles.push(streamAcl)
      }

      return {} as StreamRecord
    },
    ...dependencyOverrides
  }

  const updateWorkspaceRole = updateWorkspaceRoleFactory(deps)

  return { updateWorkspaceRole, context }
}

describe('Workspace role services', () => {
  describe('deleteWorkspaceRoleFactory creates a function, that', () => {
    it('deletes the workspace role', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })
      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      const { deleteWorkspaceRole, context } = buildDeleteWorkspaceRoleAndTestContext({
        workspaceId,
        workspaceRoles: [role]
      })

      const deletedRole = await deleteWorkspaceRole({ userId, workspaceId })

      expect(context.workspaceRoles.length).to.equal(0)
      expect(deletedRole).to.deep.equal(role)
    })
    it('emits a role-deleted event', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })
      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      const { deleteWorkspaceRole, context } = buildDeleteWorkspaceRoleAndTestContext({
        workspaceId,
        workspaceRoles: [role]
      })

      await deleteWorkspaceRole({ userId, workspaceId })

      expect(context.eventData.isCalled).to.be.true
      expect(context.eventData.eventName).to.equal(WorkspaceEvents.RoleDeleted)
      expect(context.eventData.payload).to.deep.equal(role)
    })
    it('throws if attempting to delete the last admin from a workspace', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })
      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Admin }

      const { deleteWorkspaceRole } = buildDeleteWorkspaceRoleAndTestContext({
        workspaceId,
        workspaceRoles: [role]
      })

      await expectToThrow(() => deleteWorkspaceRole({ userId, workspaceId }))
    })
    it('deletes workspace project roles', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const { deleteWorkspaceRole, context } = buildDeleteWorkspaceRoleAndTestContext({
        workspaceId,
        workspaceRoles: [{ userId, workspaceId, role: Roles.Workspace.Member }],
        workspaceProjects: [{ id: projectId } as StreamRecord],
        workspaceProjectRoles: [
          { userId, role: Roles.Stream.Contributor, resourceId: projectId }
        ]
      })

      await deleteWorkspaceRole({ userId, workspaceId })

      expect(context.workspaceProjectRoles.length).to.equal(0)
    })
  })

  describe('updateWorkspaceRoleFactory creates a function, that', () => {
    it('sets the workspace role', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })
      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      const { updateWorkspaceRole, context } = buildUpdateWorkspaceRoleAndTestContext({
        workspaceId
      })

      await updateWorkspaceRole(role)

      expect(context.workspaceRoles.length).to.equal(1)
      expect(context.workspaceRoles[0]).to.deep.equal(role)
    })
    it('emits a role-updated event', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })
      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      const { updateWorkspaceRole, context } = buildUpdateWorkspaceRoleAndTestContext({
        workspaceId
      })

      await updateWorkspaceRole(role)

      expect(context.eventData.isCalled).to.be.true
      expect(context.eventData.eventName).to.equal(WorkspaceEvents.RoleUpdated)
      expect(context.eventData.payload).to.deep.equal(role)
    })
    it('throws if attempting to remove the last admin in a workspace', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })
      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Admin }

      const { updateWorkspaceRole } = buildUpdateWorkspaceRoleAndTestContext({
        workspaceId,
        workspaceRoles: [role]
      })

      await expectToThrow(() =>
        updateWorkspaceRole({ ...role, role: Roles.Workspace.Member })
      )
    })
    it('sets roles on workspace projects', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const workspaceRole: WorkspaceAcl = {
        userId,
        workspaceId,
        role: Roles.Workspace.Admin
      }

      const { updateWorkspaceRole, context } = buildUpdateWorkspaceRoleAndTestContext({
        workspaceId,
        workspaceProjects: [{ id: projectId } as StreamRecord]
      })

      await updateWorkspaceRole(workspaceRole)

      expect(context.workspaceProjectRoles.length).to.equal(1)
      expect(context.workspaceProjectRoles[0].userId).to.equal(userId)
      expect(context.workspaceProjectRoles[0].resourceId).to.equal(projectId)
      expect(context.workspaceProjectRoles[0].role).to.equal(Roles.Stream.Owner)
    })
  })
})

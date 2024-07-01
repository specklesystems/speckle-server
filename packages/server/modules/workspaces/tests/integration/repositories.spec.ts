// TODO: test deleting user doesn't delete the workspace they created

import {
  deleteWorkspaceRoleFactory,
  getWorkspaceFactory,
  getWorkspaceRoleFactory,
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import db from '@/db/knex'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'
import { expectToThrow } from '@/test/assertionHelper'

const getWorkspace = getWorkspaceFactory({ db })
const upsertWorkspace = upsertWorkspaceFactory({ db })
const deleteWorkspaceRole = deleteWorkspaceRoleFactory({ db })
const getWorkspaceRole = getWorkspaceRoleFactory({ db })
const upsertWorkspaceRole = upsertWorkspaceRoleFactory({ db })

describe('Workspace repositories', () => {
  describe('getWorkspaceFactory creates a function, that', () => {
    it('returns null if the workspace is not found', async () => {
      const workspace = await getWorkspace({
        workspaceId: cryptoRandomString({ length: 10 })
      })
      expect(workspace).to.be.null
    })
    // not testing get here, we're going to use that for testing upsert
  })

  describe('upsertWorkspaceFactory creates a function, that', () => {
    it('upserts the workspace', async () => {
      const workspace: Workspace = {
        id: cryptoRandomString({ length: 10 }),
        name: cryptoRandomString({ length: 10 }),
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        logoUrl: null
      }
      await upsertWorkspace({ workspace })
      let storedWorkspace = await getWorkspace({ workspaceId: workspace.id })
      expect(storedWorkspace).to.deep.equal(workspace)

      workspace.description = 'now im adding a description to the workspace'

      await upsertWorkspace({ workspace })
      storedWorkspace = await getWorkspace({ workspaceId: workspace.id })
      expect(storedWorkspace).to.deep.equal(workspace)
    })
    it('updates only relevant work workspace fields', async () => {
      const workspace: Workspace = {
        id: cryptoRandomString({ length: 10 }),
        name: cryptoRandomString({ length: 10 }),
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        logoUrl: null
      }
      await upsertWorkspace({ workspace })
      let storedWorkspace = await getWorkspace({ workspaceId: workspace.id })
      expect(storedWorkspace).to.deep.equal(workspace)
      await upsertWorkspace({
        workspace: {
          ...workspace,
          id: cryptoRandomString({ length: 13 }),
          createdAt: new Date()
        }
      })

      storedWorkspace = await getWorkspace({ workspaceId: workspace.id })
      expect(storedWorkspace).to.deep.equal(workspace)
    })
  })

  describe('deleteWorkspaceRoleFactory creates a function, that', () => {
    it('deletes specified workspace role', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      await upsertWorkspaceRole({ userId, workspaceId, role: 'workspace:member' })
      await deleteWorkspaceRole({ userId, workspaceId })

      const role = await getWorkspaceRole({ userId, workspaceId })

      expect(role).to.be.null
    })
    it('returns deleted workspace role', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const createdRole = await upsertWorkspaceRole({
        userId,
        workspaceId,
        role: 'workspace:member'
      })
      const deletedRole = await deleteWorkspaceRole({ userId, workspaceId })

      expect(deletedRole).to.deep.equal(createdRole)
    })
    it('return null if role does not exist', async () => {
      const deletedRole = await deleteWorkspaceRole({ userId: '', workspaceId: '' })

      expect(deletedRole).to.be.null
    })
    it('throws if target user is last workspace admin', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      await upsertWorkspaceRole({ userId, workspaceId, role: 'workspace:admin' })

      expectToThrow(() => deleteWorkspaceRole({ userId, workspaceId }))
    })
  })

  describe('upsertWorkspaceRoleFactory creates a function, that', () => {
    it('throws if an unknown role is provided', async () => {
      const role: WorkspaceAcl = {
        // @ts-expect-error type asserts valid values for `role`
        role: 'fake-role',
        userId: '',
        workspaceId: ''
      }

      expectToThrow(() => upsertWorkspaceRole(role))
    })
    it('throws if last admin is being removed', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      await upsertWorkspaceRole({ workspaceId, userId, role: 'workspace:admin' })

      expectToThrow(() =>
        upsertWorkspaceRole({ workspaceId, userId, role: 'workspace:member' })
      )
    })
  })
})

import {
  getWorkspaceFactory,
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
const upsertWorkspaceRole = upsertWorkspaceRoleFactory({ db })

const createAndStoreTestWorkspace = async (): Promise<Workspace> => {
  const workspace: Workspace = {
    id: cryptoRandomString({ length: 10 }),
    name: cryptoRandomString({ length: 10 }),
    createdAt: new Date(),
    updatedAt: new Date(),
    description: null,
    logoUrl: null
  }

  await upsertWorkspace({ workspace })

  return workspace
}

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
      const testWorkspace = await createAndStoreTestWorkspace()
      const storedWorkspace = await getWorkspace({ workspaceId: testWorkspace.id })
      expect(storedWorkspace).to.deep.equal(testWorkspace)

      const modifiedTestWorkspace: Workspace = {
        ...testWorkspace,
        description: 'now im adding a description to the workspace'
      }

      await upsertWorkspace({ workspace: modifiedTestWorkspace })

      const modifiedStoredWorkspace = await getWorkspace({
        workspaceId: testWorkspace.id
      })

      expect(modifiedStoredWorkspace).to.deep.equal(modifiedTestWorkspace)
    })
    it('updates only relevant workspace fields', async () => {
      const testWorkspace = await createAndStoreTestWorkspace()
      const storedWorkspace = await getWorkspace({ workspaceId: testWorkspace.id })
      expect(storedWorkspace).to.deep.equal(testWorkspace)

      await upsertWorkspace({
        workspace: {
          ...testWorkspace,
          id: cryptoRandomString({ length: 13 }),
          createdAt: new Date()
        }
      })

      const modifiedStoredWorkspace = await getWorkspace({
        workspaceId: testWorkspace.id
      })

      expect(modifiedStoredWorkspace).to.deep.equal(testWorkspace)
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

      await expectToThrow(() => upsertWorkspaceRole(role))
    })
  })
})

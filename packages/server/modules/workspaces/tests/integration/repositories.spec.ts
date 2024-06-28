// TODO: test deleting user doesn't delete the workspace they created

import {
  getWorkspaceFactory,
  upsertWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import db from '@/db/knex'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import { Workspace } from '@/modules/workspaces/domain/types'

const getWorkspace = getWorkspaceFactory({ db })
const upsertWorkspace = upsertWorkspaceFactory({ db })

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
})

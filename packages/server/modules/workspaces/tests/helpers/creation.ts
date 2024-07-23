import { db } from '@/db/knex'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import { createWorkspaceFactory } from '@/modules/workspaces/services/management'
import { BasicTestUser } from '@/test/authHelper'

export type BasicTestWorkspace = {
  /**
   * Leave empty, will be filled on creation
   */
  id: string
  /**
   * Leave empty, will be filled on creation
   */
  ownerId: string
  name: string
  description?: string
  logoUrl?: string
}

export const createTestWorkspace = async (
  workspace: BasicTestWorkspace,
  owner: BasicTestUser
) => {
  const createWorkspace = createWorkspaceFactory({
    upsertWorkspace: upsertWorkspaceFactory({ db }),
    upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
    storeBlob: () => Promise.resolve(''),
    emitWorkspaceEvent: (...args) => getEventBus().emit(...args)
  })

  const finalWorkspace = await createWorkspace({
    userId: owner.id,
    workspaceInput: {
      name: workspace.name,
      description: workspace.description || null,
      logo: workspace.logoUrl || null
    }
  })

  workspace.id = finalWorkspace.id
  workspace.ownerId = owner.id
}

export const createTestWorkspaces = async (
  pairs: [BasicTestWorkspace, BasicTestUser][]
) => {
  await Promise.all(pairs.map((p) => createTestWorkspace(p[0], p[1])))
}

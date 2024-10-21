import { UpsertWorkspace } from '@/modules/workspaces/domain/operations'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { Roles } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'

export const createAndStoreTestWorkspaceFactory =
  ({ upsertWorkspace }: { upsertWorkspace: UpsertWorkspace }) =>
  async (workspaceOverrides: Partial<Workspace> = {}) => {
    const workspace: Omit<Workspace, 'domains'> = {
      id: cryptoRandomString({ length: 10 }),
      slug: cryptoRandomString({ length: 10 }),
      name: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      description: null,
      logo: null,
      domainBasedMembershipProtectionEnabled: false,
      discoverabilityEnabled: false,
      defaultLogoIndex: 0,
      defaultProjectRole: Roles.Stream.Contributor,
      ...workspaceOverrides
    }

    await upsertWorkspace({ workspace })

    return workspace
  }

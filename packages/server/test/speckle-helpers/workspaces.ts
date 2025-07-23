import type { UpsertWorkspace } from '@/modules/workspaces/domain/operations'
import type { Workspace } from '@/modules/workspacesCore/domain/types'
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
      isExclusive: false,
      domainBasedMembershipProtectionEnabled: false,
      discoverabilityEnabled: false,
      discoverabilityAutoJoinEnabled: false,
      defaultSeatType: null,
      isEmbedSpeckleBrandingHidden: false,
      ...workspaceOverrides
    }

    await upsertWorkspace({ workspace })

    return workspace
  }

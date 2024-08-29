import { CountWorkspaceRoleWithOptionalProjectRole } from '@/modules/workspaces/domain/operations'
import { Roles, throwUncoveredError } from '@speckle/shared'

type KnownWorkspaceCostItemNames =
  | 'workspace admin'
  | 'workspace member'
  | 'read/write guest'
  | 'read only guest'

type KnownCurrencies = 'GBP'

type WorkspaceCostItem = {
  name: KnownWorkspaceCostItemNames
  description: string
  count: number
  cost: number
}

const getWorkspaceCostItemCost = ({
  name
}: {
  name: KnownWorkspaceCostItemNames
  currency?: KnownCurrencies
}): number => {
  switch (name) {
    case 'workspace admin':
      return 70
    case 'workspace member':
      return 50
    case 'read/write guest':
      return 10
    case 'read only guest':
      return 0
    default:
      throwUncoveredError(name)
  }
}

type GetWorkspaceCostItems = (args: {
  workspaceId: string
}) => Promise<WorkspaceCostItem[]>

export const getWorkspaceCostItemsFactory =
  ({
    countRole
  }: {
    countRole: CountWorkspaceRoleWithOptionalProjectRole
  }): GetWorkspaceCostItems =>
  async ({ workspaceId }) => {
    const [adminCount, memberCount, writeGuestCount, readGuestCount] =
      await Promise.all([
        countRole({ workspaceId, workspaceRole: Roles.Workspace.Admin }),
        countRole({ workspaceId, workspaceRole: Roles.Workspace.Member }),
        countRole({
          workspaceId,
          workspaceRole: Roles.Workspace.Guest,
          projectRole: Roles.Stream.Contributor
        }),
        countRole({
          workspaceId,
          workspaceRole: Roles.Workspace.Guest,
          projectRole: Roles.Stream.Reviewer
        })
      ])

    const workspaceCostItems: WorkspaceCostItem[] = []

    if (adminCount)
      workspaceCostItems.push({
        name: 'workspace admin',
        description: 'Workspace administrator with all the powers',
        count: adminCount,
        cost: getWorkspaceCostItemCost({ name: 'workspace admin' })
      })
    if (memberCount)
      workspaceCostItems.push({
        name: 'workspace member',
        description: 'General workspace member',
        count: memberCount,
        cost: getWorkspaceCostItemCost({ name: 'workspace member' })
      })
    if (writeGuestCount)
      workspaceCostItems.push({
        name: 'read/write guest',
        description: 'Workspace guest with write access to minimum 1 workspace project',
        count: writeGuestCount,
        cost: getWorkspaceCostItemCost({ name: 'read/write guest' })
      })
    if (readGuestCount)
      workspaceCostItems.push({
        name: 'read only guest',
        description: 'Workspace guest with only read access to some workspace projects',
        count: readGuestCount,
        cost: getWorkspaceCostItemCost({ name: 'read only guest' })
      })

    return workspaceCostItems
  }

type WorkspaceCost = {
  subTotal: number
  currency: KnownCurrencies
  items: WorkspaceCostItem[]
}

export const getWorkspaceCostFactory =
  ({ getWorkspaceCostItems }: { getWorkspaceCostItems: GetWorkspaceCostItems }) =>
  async ({ workspaceId }: { workspaceId: string }): Promise<WorkspaceCost> => {
    const items = await getWorkspaceCostItems({ workspaceId })

    const subTotal = items.reduce((acc, { cost, count }) => acc + cost * count, 0)

    return {
      currency: 'GBP',
      items,
      subTotal
    }
  }

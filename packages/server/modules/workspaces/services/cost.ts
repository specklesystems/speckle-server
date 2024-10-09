import {
  CountWorkspaceRoleWithOptionalProjectRole,
  GetUserIdsWithRoleInWorkspace
} from '@/modules/workspaces/domain/operations'
import { Roles, throwUncoveredError } from '@speckle/shared'

type KnownWorkspaceCostItemNames =
  | 'workspace-members'
  | 'free-guests'
  | 'read-write-guests'
  | 'read-only-guests'

type KnownCurrencies = 'GBP'

type WorkspaceCostItem = {
  name: KnownWorkspaceCostItemNames
  description: string
  count: number
  cost: number
  label: string
}

const getWorkspaceCostItemCost = ({
  name
}: {
  name: KnownWorkspaceCostItemNames
  currency?: KnownCurrencies
}): number => {
  switch (name) {
    case 'workspace-members':
      return 49
    case 'free-guests':
      return 0
    case 'read-write-guests':
      return 15
    case 'read-only-guests':
      return 5
    default:
      throwUncoveredError(name)
  }
}

type GetWorkspaceCostItems = (args: {
  workspaceId: string
}) => Promise<WorkspaceCostItem[]>

export const getWorkspaceCostItemsFactory =
  ({
    countRole,
    getUserIdsWithRoleInWorkspace
  }: {
    countRole: CountWorkspaceRoleWithOptionalProjectRole
    getUserIdsWithRoleInWorkspace: GetUserIdsWithRoleInWorkspace
  }): GetWorkspaceCostItems =>
  async ({ workspaceId }) => {
    const freeGuestsIds = await getUserIdsWithRoleInWorkspace(
      {
        workspaceId,
        workspaceRole: Roles.Workspace.Guest
      },
      { limit: 10 }
    )
    const [adminCount, memberCount, writeGuestCount, readGuestCount] =
      await Promise.all([
        countRole({ workspaceId, workspaceRole: Roles.Workspace.Admin }),
        countRole({ workspaceId, workspaceRole: Roles.Workspace.Member }),
        countRole({
          workspaceId,
          workspaceRole: Roles.Workspace.Guest,
          projectRole: Roles.Stream.Contributor,
          skipUserIds: freeGuestsIds
        }),
        countRole({
          workspaceId,
          workspaceRole: Roles.Workspace.Guest,
          projectRole: Roles.Stream.Reviewer,
          skipUserIds: freeGuestsIds
        })
      ])

    const workspaceCostItems: WorkspaceCostItem[] = []

    const workspaceMembersCount = adminCount + memberCount
    const freeGuestsCount = freeGuestsIds.length

    workspaceCostItems.push({
      name: 'workspace-members',
      description: 'General workspace member',
      count: workspaceMembersCount,
      cost: getWorkspaceCostItemCost({ name: 'workspace-members' }),
      label: `${workspaceMembersCount} workspace ${
        workspaceMembersCount === 1 ? 'member' : 'members'
      }`
    })
    workspaceCostItems.push({
      name: 'free-guests',
      description: 'The first 10 workspace guests are free',
      count: freeGuestsCount,
      cost: getWorkspaceCostItemCost({ name: 'free-guests' }),
      label: `${freeGuestsCount}/10 free ${freeGuestsCount === 1 ? 'guest' : 'guests'}`
    })
    workspaceCostItems.push({
      name: 'read-write-guests',
      description: 'Workspace guests with write access to minimum 1 workspace project',
      count: writeGuestCount,
      cost: getWorkspaceCostItemCost({ name: 'read-write-guests' }),
      label: `${writeGuestCount} read/write ${
        writeGuestCount === 1 ? 'guest' : 'guests'
      }`
    })
    workspaceCostItems.push({
      name: 'read-only-guests',
      description: 'Workspace guests with only read access to some workspace projects',
      count: readGuestCount,
      cost: getWorkspaceCostItemCost({ name: 'read-only-guests' }),
      label: `${readGuestCount} read only ${readGuestCount === 1 ? 'guest' : 'guests'}`
    })

    return workspaceCostItems
  }

type WorkspaceDiscount = {
  name: string
  amount: number
}

type WorkspaceCost = {
  subTotal: number
  currency: KnownCurrencies
  items: WorkspaceCostItem[]
  total: number
  discount?: WorkspaceDiscount
}

export const calculateWorkspaceTotalCost = ({
  subTotal,
  discount
}: Pick<WorkspaceCost, 'subTotal' | 'discount'>) => {
  if (!discount) {
    return subTotal
  }
  return subTotal * discount?.amount
}

export const getWorkspaceCostFactory =
  ({
    getWorkspaceCostItems,
    discount
  }: {
    getWorkspaceCostItems: GetWorkspaceCostItems
    discount?: WorkspaceDiscount
  }) =>
  async ({ workspaceId }: { workspaceId: string }): Promise<WorkspaceCost> => {
    const items = await getWorkspaceCostItems({ workspaceId })

    const subTotal = items.reduce((acc, { cost, count }) => acc + cost * count, 0)

    return {
      currency: 'GBP',
      items,
      subTotal,
      discount,
      total: calculateWorkspaceTotalCost({
        subTotal,
        discount
      })
    }
  }

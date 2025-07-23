import type { WorkspacePlans } from '@speckle/shared'

const WorkspacePlansUpgradeMapping: Record<WorkspacePlans, WorkspacePlans[]> = {
  academia: [],
  unlimited: [],
  free: ['team', 'teamUnlimited', 'pro', 'proUnlimited'],
  team: ['team', 'teamUnlimited', 'pro', 'proUnlimited'],
  teamUnlimited: ['teamUnlimited', 'pro', 'proUnlimited'],
  teamUnlimitedInvoiced: [],
  pro: ['pro', 'proUnlimited'],
  proUnlimited: ['proUnlimited'],
  proUnlimitedInvoiced: [],
  enterprise: []
}

export const isUpgradeWorkspacePlanValid = ({
  current,
  upgrade
}: {
  current: WorkspacePlans
  upgrade: WorkspacePlans
}): boolean => {
  return WorkspacePlansUpgradeMapping[current].includes(upgrade)
}

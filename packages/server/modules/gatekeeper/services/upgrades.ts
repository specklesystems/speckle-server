import { WorkspacePlans } from '@speckle/shared'
import { z } from 'zod'

const WorkspacePlansUpgradeMapping = z.union([
  z.object({
    current: z.literal('free'),
    upgrade: z.union([z.literal('team'), z.literal('pro')])
  }),
  z.object({
    current: z.literal('team'),
    upgrade: z.union([z.literal('team'), z.literal('pro')])
  }),
  z.object({
    current: z.literal('pro'),
    upgrade: z.literal('pro')
  })
])

export const isUpgradeWorkspacePlanValid = ({
  current,
  upgrade
}: {
  current: WorkspacePlans
  upgrade: WorkspacePlans
}): boolean => {
  return WorkspacePlansUpgradeMapping.safeParse({ current, upgrade }).success
}

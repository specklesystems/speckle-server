import { RoleInfo } from '@speckle/shared'

export const roleLookupTable = RoleInfo.Workspace

export const getRoleLabel = (role: keyof typeof roleLookupTable) => {
  return roleLookupTable[role] || role.split(':')[1]
}

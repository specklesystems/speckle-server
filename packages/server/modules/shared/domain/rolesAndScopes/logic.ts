import { UserRoleData } from '@/modules/shared/domain/rolesAndScopes/types'
import { AvailableRoles } from '@speckle/shared'
import { isUndefined } from 'lodash'

export const orderByWeight = <T extends AvailableRoles>(
  roles: T[],
  definitions: UserRoleData<T>[]
): UserRoleData<T>[] => {
  const roleDefinitions = roles
    .map((role) => definitions.find((definition) => definition.name === role))
    .filter((definition): definition is UserRoleData<T> => !isUndefined(definition))

  return roleDefinitions.sort((a, b) => b.weight - a.weight)
}

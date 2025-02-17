import { Roles, type ServerRoles } from '@speckle/shared'
import { isArray, isString } from 'lodash-es'
import type { UserSearchItem } from '~/lib/common/composables/users'
import { isEmail } from '~/lib/common/helpers/validation'

export type UserSearchItemOrEmail = UserSearchItem | string

export const isValidEmail = (val: string) =>
  isEmail(val || '', {
    field: '',
    value: '',
    form: {}
  }) === true
    ? true
    : false

export const filterInvalidInviteTargets = (
  targets: UserSearchItemOrEmail | UserSearchItemOrEmail[],
  params: {
    isTargetResourceOwner: boolean
    emailTargetServerRole: ServerRoles
  }
) => {
  const { isTargetResourceOwner } = params
  const isTargetServerGuest = (i: UserSearchItemOrEmail) => {
    if (isString(i)) {
      return params.emailTargetServerRole === Roles.Server.Guest
    } else {
      return i.role === Roles.Server.Guest
    }
  }

  return (isArray(targets) ? targets : [targets]).filter((u) => {
    if (isTargetServerGuest(u) && isTargetResourceOwner) return false

    if (isString(u)) {
      return isValidEmail(u)
    } else {
      return true
    }
  })
}

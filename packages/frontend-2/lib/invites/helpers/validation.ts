import { isEmail } from '~/lib/common/helpers/validation'
import type { GenericValidateFunction } from 'vee-validate'
import {
  Roles,
  type StreamRoles,
  type WorkspaceRoles,
  type MaybeNullOrUndefined
} from '@speckle/shared'

export const isValidEmail = (val: string) =>
  isEmail(val || '', {
    field: '',
    value: '',
    form: {}
  }) === true
    ? true
    : false

export const matchesDomainPolicy = (
  val: string,
  allowedDomains: MaybeNullOrUndefined<string[]>
) => {
  if (!allowedDomains || allowedDomains.length === 0) return true
  return allowedDomains && val ? allowedDomains.includes(val.split('@')[1]) : true
}

export const canHaveRole =
  (params: {
    allowedDomains: MaybeNullOrUndefined<string[]>
    workspaceRole?: WorkspaceRoles
    projectRole?: StreamRoles
  }): GenericValidateFunction<string> =>
  (val) => {
    const { allowedDomains, workspaceRole, projectRole } = params
    if (!allowedDomains || !val) return true

    if (!matchesDomainPolicy(val, allowedDomains)) {
      if (workspaceRole && workspaceRole !== Roles.Workspace.Guest) {
        return 'This email does not match the set domain policy, and can only be invited as a guest'
      }
      if (projectRole && projectRole !== Roles.Stream.Reviewer) {
        return 'This email does not match the set domain policy, and can only be invited as a reviewer'
      }
    }

    return true
  }

export const isEmailOrUserId =
  (params: { userId: MaybeNullOrUndefined<string> }): GenericValidateFunction<string> =>
  (val) => {
    const { userId } = params

    if (!val) return true
    if (userId) return true
    if (!isValidEmail(val)) return 'Please enter a valid email address or select a user'

    return true
  }

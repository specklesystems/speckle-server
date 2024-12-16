import { isEmail } from '~/lib/common/helpers/validation'
import type { GenericValidateFunction } from 'vee-validate'
import { Roles, type WorkspaceRoles, type MaybeNullOrUndefined } from '@speckle/shared'

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
  return allowedDomains && val ? allowedDomains.includes(val.split('@')[1]) : true
}

export const canHaveRole =
  (params: {
    allowedDomains: MaybeNullOrUndefined<string[]>
    workspaceRole?: WorkspaceRoles
  }): GenericValidateFunction<string> =>
  (val) => {
    const { allowedDomains, workspaceRole } = params
    if (!allowedDomains || !val) return true

    if (
      !matchesDomainPolicy(val, allowedDomains) &&
      workspaceRole !== Roles.Workspace.Guest
    ) {
      return 'This email does not match the set domain policy, and can only be invited as a guest'
    }

    return true
  }

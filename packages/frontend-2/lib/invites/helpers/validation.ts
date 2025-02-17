import { isEmail } from '~/lib/common/helpers/validation'
import type { GenericValidateFunction } from 'vee-validate'
import {
  Roles,
  type StreamRoles,
  type WorkspaceRoles,
  type ServerRoles,
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

export const isRequiredIfDependencyExists =
  (dependency: () => string) => (val?: string) =>
    !dependency() || !!val || 'This field is required'

export const canBeServerGuest =
  ({
    workspaceRole,
    projectRole
  }: {
    workspaceRole?: WorkspaceRoles
    projectRole?: StreamRoles
  }) =>
  (val?: ServerRoles) => {
    if (val === Roles.Server.Guest) {
      if (projectRole === Roles.Stream.Owner) {
        return 'A guest user cannot be a stream owner'
      }
      if (workspaceRole === Roles.Workspace.Admin) {
        return 'A guest user cannot be a workspace admin'
      }
      if (workspaceRole === Roles.Workspace.Member) {
        return 'A guest user cannot be a workspace member'
      }
    }

    return true
  }

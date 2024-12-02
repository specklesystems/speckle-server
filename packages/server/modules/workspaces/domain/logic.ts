import { UserEmail } from '@/modules/core/domain/userEmails/types'
import {
  WorkspaceDomainsInvalidState,
  WorkspaceInvalidUpdateError
} from '@/modules/workspaces/errors/workspace'
import {
  LimitedWorkspace,
  Workspace,
  WorkspaceDefaultProjectRole,
  WorkspaceDomain
} from '@/modules/workspacesCore/domain/types'
import { Roles, WorkspaceRoles } from '@speckle/shared'
import { pick } from 'lodash'

export const userEmailsCompliantWithWorkspaceDomains = ({
  userEmails,
  workspaceDomains
}: {
  userEmails: UserEmail[]
  workspaceDomains: WorkspaceDomain[]
}): boolean =>
  anyEmailCompliantWithWorkspaceDomains({
    emails: userEmails.filter((e) => e.verified).map((e) => e.email),
    workspaceDomains
  })

export const anyEmailCompliantWithWorkspaceDomains = ({
  emails,
  workspaceDomains
}: {
  emails: string[]
  workspaceDomains: WorkspaceDomain[]
}): boolean => {
  const validWorkspaceDomains = workspaceDomains.filter((domain) => domain.verified)

  // we must have min 1 domain to validate compliance
  if (!validWorkspaceDomains.length) throw new WorkspaceDomainsInvalidState()

  for (const email of emails) {
    if (validWorkspaceDomains.some((domain) => email.endsWith(domain.domain)))
      return true
  }
  return false
}

/**
 * Given an optional string value, assert it is a valid default project role and return it.
 */
export const parseDefaultProjectRole = (
  role?: string | null
): WorkspaceDefaultProjectRole | null => {
  if (!role) return null

  const isValidRole = (role: string): role is WorkspaceDefaultProjectRole => {
    const validRoles: string[] = [Roles.Stream.Reviewer, Roles.Stream.Contributor]
    return validRoles.includes(role)
  }

  if (!isValidRole(role)) {
    throw new WorkspaceInvalidUpdateError('Provided default project role is invalid')
  }

  return role
}

export const isWorkspaceRole = (role: string): role is WorkspaceRoles => {
  const validRoles: string[] = Object.values(Roles.Workspace)
  return validRoles.includes(role)
}

export const toLimitedWorkspace = (workspace: Workspace): LimitedWorkspace => {
  return pick(workspace, [
    'id',
    'slug',
    'name',
    'description',
    'logo',
    'defaultLogoIndex'
  ])
}

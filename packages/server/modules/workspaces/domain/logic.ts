import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { GetWorkspaceRoleToDefaultProjectRoleMapping } from '@/modules/workspaces/domain/operations'
import { WorkspaceDomainsInvalidState } from '@/modules/workspaces/errors/workspace'
import { WorkspaceDomain } from '@/modules/workspacesCore/domain/types'
import { Roles } from '@speckle/shared'

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
 * Given a user's workspace role, return the initial role they should have for workspace projects.
 */
export const mapWorkspaceRoleToInitialProjectRole: GetWorkspaceRoleToDefaultProjectRoleMapping =
  async () => ({
    [Roles.Workspace.Guest]: null,
    [Roles.Workspace.Member]: Roles.Stream.Reviewer,
    [Roles.Workspace.Admin]: Roles.Stream.Owner
  })

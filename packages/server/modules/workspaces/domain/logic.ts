import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { WorkspaceDomainsInvalidState } from '@/modules/workspaces/errors/workspace'
import { WorkspaceDomain } from '@/modules/workspacesCore/domain/types'

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

import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { createRandomPassword } from '@/modules/core/helpers/testHelpers'
import {
  WorkspaceJoinNotAllowedError,
  WorkspaceNotDiscoverableError,
  WorkspaceNotJoinableError
} from '@/modules/workspaces/errors/workspace'
import { joinWorkspaceFactory } from '@/modules/workspaces/services/join'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import {
  WorkspaceAcl,
  WorkspaceDomain,
  WorkspaceWithDomains
} from '@/modules/workspacesCore/domain/types'
import { expectToThrow } from '@/test/assertionHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import { assign } from 'lodash'

const createTestWorkspaceWithDomains = (
  arg?: Partial<WorkspaceWithDomains> | undefined
): WorkspaceWithDomains => {
  const workspace: WorkspaceWithDomains = {
    createdAt: new Date(),
    updatedAt: new Date(),
    name: createRandomPassword(),
    slug: createRandomPassword(),
    description: createRandomPassword(),
    id: createRandomPassword(),
    logo: null,
    domains: [],
    discoverabilityEnabled: false,
    domainBasedMembershipProtectionEnabled: false,
    defaultProjectRole: Roles.Stream.Contributor,
    defaultLogoIndex: 0
  }
  if (arg) assign(workspace, arg)
  return workspace
}

describe('Workspace join services', () => {
  describe('joinWorkspaceFactory returns a function, that', () => {
    it('throws an error if the workspace is not discoverable', async () => {
      const userId = createRandomPassword()
      const workspaceId = createRandomPassword()
      const error = await expectToThrow(async () => {
        await joinWorkspaceFactory({
          getUserEmails: async () => [],
          getWorkspaceWithDomains: async () => {
            return createTestWorkspaceWithDomains()
          },
          upsertWorkspaceRole: async () => {
            expect.fail()
          },
          emitWorkspaceEvent: async () => {
            expect.fail()
          }
        })({ userId, workspaceId })
      })
      expect(error.message).to.be.equal(new WorkspaceNotDiscoverableError().message)
    })
    it('throws an error if the workspace has no verified domains', async () => {
      const userId = createRandomPassword()
      const workspaceId = createRandomPassword()
      const error = await expectToThrow(async () => {
        await joinWorkspaceFactory({
          getUserEmails: async () => [],
          getWorkspaceWithDomains: async () => {
            return createTestWorkspaceWithDomains({
              discoverabilityEnabled: true,
              domains: [{ domain: 'example.com', verified: false }] as WorkspaceDomain[]
            })
          },
          upsertWorkspaceRole: async () => {
            expect.fail()
          },
          emitWorkspaceEvent: async () => {
            expect.fail()
          }
        })({ userId, workspaceId })
      })
      expect(error.message).to.be.equal(new WorkspaceNotJoinableError().message)
    })
    it('throws an error if the user has no verified email matching the domains', async () => {
      const userId = createRandomPassword()
      const workspaceId = createRandomPassword()
      const error = await expectToThrow(async () => {
        await joinWorkspaceFactory({
          getUserEmails: async () =>
            [{ email: 'test@example.com', verified: false }] as UserEmail[],
          getWorkspaceWithDomains: async () => {
            return createTestWorkspaceWithDomains({
              discoverabilityEnabled: true,
              domains: [{ domain: 'example.com', verified: true }] as WorkspaceDomain[]
            })
          },
          upsertWorkspaceRole: async () => {
            expect.fail()
          },
          emitWorkspaceEvent: async () => {
            expect.fail()
          }
        })({ userId, workspaceId })
      })
      expect(error.message).to.be.equal(new WorkspaceJoinNotAllowedError().message)
    })
    it('creates a workspace member role and emits workspace events', async () => {
      const userId = createRandomPassword()
      const workspaceId = createRandomPassword()
      let storedWorkspaceRole: WorkspaceAcl | undefined = undefined
      const firedEvents: string[] = []
      await joinWorkspaceFactory({
        getUserEmails: async () =>
          [{ email: 'test@example.com', verified: true }] as UserEmail[],
        getWorkspaceWithDomains: async () => {
          return createTestWorkspaceWithDomains({
            discoverabilityEnabled: true,
            domains: [{ domain: 'example.com', verified: true }] as WorkspaceDomain[]
          })
        },
        upsertWorkspaceRole: async (workspaceRole) => {
          storedWorkspaceRole = workspaceRole
        },
        emitWorkspaceEvent: async ({ eventName }) => {
          firedEvents.push(eventName)
        }
      })({ userId, workspaceId })

      expect(storedWorkspaceRole!.userId).to.equal(userId)
      expect(storedWorkspaceRole!.workspaceId).to.equal(workspaceId)
      expect(storedWorkspaceRole!.role).to.equal(Roles.Workspace.Member)
      expect(firedEvents).deep.equal([
        WorkspaceEvents.JoinedFromDiscovery,
        WorkspaceEvents.RoleUpdated
      ])
    })
  })
})

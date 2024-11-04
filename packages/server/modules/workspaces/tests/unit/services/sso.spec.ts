/* eslint-disable camelcase */

import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import { getDefaultSsoSessionExpirationDate } from '@/modules/workspaces/domain/sso/logic'
import {
  OidcProvider,
  UserSsoSessionRecord,
  WorkspaceSsoProvider,
  WorkspaceSsoProviderRecord
} from '@/modules/workspaces/domain/sso/types'
import {
  OidcProviderMissingGrantTypeError,
  SsoProviderExistsError,
  SsoUserInviteRequiredError
} from '@/modules/workspaces/errors/sso'
import { WorkspaceInvalidRoleError } from '@/modules/workspaces/errors/workspace'
import {
  createWorkspaceUserFromSsoProfileFactory,
  linkUserWithSsoProviderFactory,
  listUserExpiredSsoSessionsFactory,
  listWorkspaceSsoMembershipsByUserEmailFactory,
  saveSsoProviderRegistrationFactory,
  startOidcSsoProviderValidationFactory
} from '@/modules/workspaces/services/sso'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { expectToThrow } from '@/test/assertionHelper'
import { wait } from '@speckle/shared'
import { assert, expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Workspace SSO services', () => {
  describe('startOidcSsoProviderValidationFactory creates a function, that', () => {
    it('throws if given provider has invalid attributes', async () => {
      const startOidcSsoProviderValidation = startOidcSsoProviderValidationFactory({
        getOidcProviderAttributes: async () => ({
          issuer: {
            claimsSupported: [],
            grantTypesSupported: [],
            responseTypesSupported: []
          },
          client: {
            grantTypes: []
          }
        }),
        storeOidcProviderValidationRequest: async () => {
          assert.fail()
        },
        generateCodeVerifier: () => ''
      })

      const err = await expectToThrow(() =>
        startOidcSsoProviderValidation({ provider: {} as OidcProvider })
      )
      expect(err.message).to.equal(OidcProviderMissingGrantTypeError.defaultMessage)
    })
  })
  describe('saveSsoProviderRegistrationFactory creates a function, that', () => {
    it('throws if a provider is already configured for the workspace', async () => {
      const saveSsoProviderRegistration = saveSsoProviderRegistrationFactory({
        getWorkspaceSsoProvider: async () => ({} as WorkspaceSsoProvider),
        storeProviderRecord: async () => {
          assert.fail()
        },
        associateSsoProviderWithWorkspace: async () => {
          assert.fail()
        }
      })

      const err = await expectToThrow(() =>
        saveSsoProviderRegistration({
          provider: {} as OidcProvider,
          workspaceId: cryptoRandomString({ length: 9 })
        })
      )
      expect(err.message).to.equal(SsoProviderExistsError.defaultMessage)
    })
  })
  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable @typescript-eslint/no-unsafe-return */
  describe('createWorkspaceUserFromSsoProfileFactory creates a function, that', () => {
    it('throws if target email does not have a valid invite to the given workspace', async () => {
      const createWorkspaceUserFromSsoProfile =
        createWorkspaceUserFromSsoProfileFactory({
          createUser: async () => '',
          upsertWorkspaceRole: async () => {},
          findInvite: async () => null,
          deleteInvite: async () => true
        })

      const err = await expectToThrow(() =>
        createWorkspaceUserFromSsoProfile({
          ssoProfile: {
            sub: '',
            email: ''
          },
          workspaceId: cryptoRandomString({ length: 9 })
        })
      )
      expect(err.message).to.equal(SsoUserInviteRequiredError.defaultMessage)
    })
    it('throws if SSO provider user profile does not have a name configured', async () => {
      const createWorkspaceUserFromSsoProfile =
        createWorkspaceUserFromSsoProfileFactory({
          createUser: async () => '',
          upsertWorkspaceRole: async () => {},
          findInvite: async () => ({} as unknown as any),
          deleteInvite: async () => true
        })

      const err = await expectToThrow(() =>
        createWorkspaceUserFromSsoProfile({
          ssoProfile: {
            sub: '',
            email: ''
          },
          workspaceId: cryptoRandomString({ length: 9 })
        })
      )
      expect(err.message).to.include('requires a name')
    })
    it('throws if SSO provider user profile does not have a verified email', async () => {
      const createWorkspaceUserFromSsoProfile =
        createWorkspaceUserFromSsoProfileFactory({
          createUser: async () => '',
          upsertWorkspaceRole: async () => {},
          findInvite: async () => ({} as unknown as any),
          deleteInvite: async () => true
        })

      const err = await expectToThrow(() =>
        createWorkspaceUserFromSsoProfile({
          ssoProfile: {
            name: 'John Speckle',
            sub: '',
            email: '',
            email_verified: false
          },
          workspaceId: cryptoRandomString({ length: 9 })
        })
      )
      expect(err.message).to.include('email is unverified')
    })
    it('throws if workspace role on invite is not a valid workspace role', async () => {
      const createWorkspaceUserFromSsoProfile =
        createWorkspaceUserFromSsoProfileFactory({
          createUser: async () => '',
          upsertWorkspaceRole: async () => {},
          findInvite: async () =>
            ({
              resource: {
                role: 'not-a-role'
              }
            } as unknown as any),
          deleteInvite: async () => true
        })

      const err = await expectToThrow(() =>
        createWorkspaceUserFromSsoProfile({
          ssoProfile: {
            name: 'John Speckle',
            sub: '',
            email: '',
            email_verified: true
          },
          workspaceId: cryptoRandomString({ length: 9 })
        })
      )
      expect(err.message).to.equal(WorkspaceInvalidRoleError.defaultMessage)
    })
    it('correctly sets both the workspace role and the server role on the given invite', async () => {
      let serverRole: string | undefined = undefined
      let workspaceRole: string | undefined = undefined

      const createWorkspaceUserFromSsoProfile =
        createWorkspaceUserFromSsoProfileFactory({
          createUser: async ({ role }) => {
            serverRole = role
            return ''
          },
          upsertWorkspaceRole: async ({ role }) => {
            workspaceRole = role
          },
          findInvite: async () =>
            ({
              resource: {
                role: 'workspace:admin',
                secondaryResourceRoles: {
                  server: 'server:admin'
                }
              }
            } as unknown as any),
          deleteInvite: async () => true
        })

      await createWorkspaceUserFromSsoProfile({
        ssoProfile: {
          name: 'John Speckle',
          sub: '',
          email: '',
          email_verified: true
        },
        workspaceId: cryptoRandomString({ length: 9 })
      })

      expect(serverRole).to.equal('server:admin')
      expect(workspaceRole).to.equal('workspace:admin')
    })
    it('deletes the workspace invite after creating the user and assigning all roles', async () => {
      let isDeleteCalled = false

      const createWorkspaceUserFromSsoProfile =
        createWorkspaceUserFromSsoProfileFactory({
          createUser: async () => '',
          upsertWorkspaceRole: async () => {},
          findInvite: async () =>
            ({
              resource: {
                role: 'workspace:admin',
                secondaryResourceRoles: {
                  server: 'server:admin'
                }
              }
            } as unknown as any),
          deleteInvite: async () => {
            isDeleteCalled = true
            return true
          }
        })

      await createWorkspaceUserFromSsoProfile({
        ssoProfile: {
          name: 'John Speckle',
          sub: '',
          email: '',
          email_verified: true
        },
        workspaceId: cryptoRandomString({ length: 9 })
      })

      expect(isDeleteCalled).to.be.true
    })
  })
  /* eslint-enable @typescript-eslint/no-explicit-any */
  /* eslint-enable @typescript-eslint/no-unsafe-return */
  describe('linkUserWithSsoProviderFactory creates a function, that', () => {
    it('does no work if user is already associated with provider', async () => {
      const userId = cryptoRandomString({ length: 9 })
      const email = 'test@example.org'

      const linkUserWithSsoProvider = linkUserWithSsoProviderFactory({
        findEmailsByUserId: async () => [
          {
            id: cryptoRandomString({ length: 9 }),
            userId,
            email,
            verified: true,
            primary: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createUserEmail: async () => {
          assert.fail()
        },
        updateUserEmail: async () => {
          assert.fail()
        }
      })

      await linkUserWithSsoProvider({
        userId,
        ssoProfile: {
          sub: cryptoRandomString({ length: 9 }),
          email
        }
      })
    })
    it('verifies user email if sso email is already associated with the user', async () => {
      const userId = cryptoRandomString({ length: 9 })
      const email = 'test@example.org'

      let isVerified = false

      const linkUserWithSsoProvider = linkUserWithSsoProviderFactory({
        findEmailsByUserId: async () => [
          {
            id: cryptoRandomString({ length: 9 }),
            userId,
            email,
            verified: false,
            primary: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createUserEmail: async () => {
          assert.fail()
        },
        updateUserEmail: async () => {
          isVerified = true
          return {} as UserEmail
        }
      })

      await linkUserWithSsoProvider({
        userId,
        ssoProfile: {
          sub: cryptoRandomString({ length: 9 }),
          email
        }
      })

      expect(isVerified).to.be.true
    })
    it('adds sso email to user emails if not already present', async () => {
      const userId = cryptoRandomString({ length: 9 })
      const email = 'test@example.org'

      const userEmails: UserEmail[] = []

      const linkUserWithSsoProvider = linkUserWithSsoProviderFactory({
        findEmailsByUserId: async () => [],
        createUserEmail: async ({ userEmail }) => {
          const email: UserEmail = {
            id: cryptoRandomString({ length: 9 }),
            userId,
            email: userEmail.email,
            verified: true,
            primary: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          userEmails.push(email)
          return email
        },
        updateUserEmail: async () => {
          assert.fail()
        }
      })

      await linkUserWithSsoProvider({
        userId,
        ssoProfile: {
          sub: cryptoRandomString({ length: 9 }),
          email
        }
      })

      expect(userEmails.length).to.equal(1)
      expect(userEmails[0].email).to.equal(email)
      expect(userEmails[0].verified).to.be.true
    })
  })
  describe('listWorkspaceSsoMembershipsByUserEmailFactory creates a function, that', () => {
    it('returns an empty array if the user does not exist', async () => {
      const listWorkspaceSsoMemberships = listWorkspaceSsoMembershipsByUserEmailFactory(
        {
          getUserByEmail: async () => null,
          listWorkspaceSsoMemberships: async () => {
            assert.fail()
          }
        }
      )

      const workspaces = await listWorkspaceSsoMemberships({
        userEmail: 'fake@example.org '
      })

      expect(workspaces.length).to.equal(0)
    })
    it('returns sanitized results if any matches are found', async () => {
      const listWorkspaceSsoMemberships = listWorkspaceSsoMembershipsByUserEmailFactory(
        {
          getUserByEmail: async () =>
            ({
              id: cryptoRandomString({ length: 9 })
            } as UserWithOptionalRole),
          listWorkspaceSsoMemberships: async () => [
            {
              id: '',
              slug: '',
              name: '',
              description: '',
              logo: null,
              defaultLogoIndex: 0,
              defaultProjectRole: 'stream:contributor',
              domainBasedMembershipProtectionEnabled: false,
              discoverabilityEnabled: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }
      )

      const workspaces = await listWorkspaceSsoMemberships({
        userEmail: 'anything@example.org'
      })

      expect(Object.keys(workspaces[0]).includes('defaultProjectRole')).to.be.false
    })
  })
  describe('listUserExpiredSsoSessionsFactory creates a function, that', () => {
    it('returns an empty array if the user has valid sessions for all of their SSO-enabled workspaces', async () => {
      const listUserExpiredSsoSessions = listUserExpiredSsoSessionsFactory({
        listWorkspaceSsoMemberships: async () => [
          {
            id: 'workspace-a'
          } as Workspace,
          {
            id: 'workspace-b'
          } as Workspace
        ],
        listUserSsoSessions: async () => [
          {
            workspaceId: 'workspace-a',
            validUntil: getDefaultSsoSessionExpirationDate()
          } as UserSsoSessionRecord & WorkspaceSsoProviderRecord,
          {
            workspaceId: 'workspace-b',
            validUntil: getDefaultSsoSessionExpirationDate()
          } as UserSsoSessionRecord & WorkspaceSsoProviderRecord
        ]
      })

      const expiredSessions = await listUserExpiredSsoSessions({ userId: '' })

      expect(expiredSessions.length).to.equal(0)
    })
    it("returns workspaces where the user's SSO session does not exist", async () => {
      const listUserExpiredSsoSessions = listUserExpiredSsoSessionsFactory({
        listWorkspaceSsoMemberships: async () => [
          {
            id: 'workspace-a'
          } as Workspace,
          {
            id: 'workspace-b'
          } as Workspace
        ],
        listUserSsoSessions: async () => [
          {
            workspaceId: 'workspace-a',
            validUntil: getDefaultSsoSessionExpirationDate()
          } as UserSsoSessionRecord & WorkspaceSsoProviderRecord
        ]
      })

      const expiredSessions = await listUserExpiredSsoSessions({ userId: '' })

      expect(expiredSessions.length).to.equal(1)
      expect(expiredSessions[0].id).to.equal('workspace-b')
    })
    it("returns workspaces where the user's SSO session exists but has expired", async () => {
      const listUserExpiredSsoSessions = listUserExpiredSsoSessionsFactory({
        listWorkspaceSsoMemberships: async () => [
          {
            id: 'workspace-a'
          } as Workspace,
          {
            id: 'workspace-b'
          } as Workspace
        ],
        listUserSsoSessions: async () => [
          {
            workspaceId: 'workspace-a',
            validUntil: getDefaultSsoSessionExpirationDate()
          } as UserSsoSessionRecord & WorkspaceSsoProviderRecord,
          {
            workspaceId: 'workspace-b',
            validUntil: new Date()
          } as UserSsoSessionRecord & WorkspaceSsoProviderRecord
        ]
      })

      await wait(50)

      const expiredSessions = await listUserExpiredSsoSessions({ userId: '' })

      expect(expiredSessions.length).to.equal(1)
      expect(expiredSessions[0].id).to.equal('workspace-b')
    })
    it('returns an empty array if the user belongs to no SSO-enabled workspaces', async () => {
      const listUserExpiredSsoSessions = listUserExpiredSsoSessionsFactory({
        listWorkspaceSsoMemberships: async () => [],
        listUserSsoSessions: async () => []
      })

      const expiredSessions = await listUserExpiredSsoSessions({ userId: '' })

      expect(expiredSessions.length).to.equal(0)
    })
  })
})

import {
  GetOidcProviderAttributes,
  StoreOidcProviderValidationRequest,
  StoreProviderRecord,
  AssociateSsoProviderWithWorkspace,
  GetWorkspaceSsoProvider,
  ListWorkspaceSsoMemberships,
  ListUserSsoSessions
} from '@/modules/workspaces/domain/sso/operations'
import {
  OidcProvider,
  OidcProviderRecord,
  OidcProviderAttributes,
  OidcProfile
} from '@/modules/workspaces/domain/sso/types'
import cryptoRandomString from 'crypto-random-string'
import { UserinfoResponse } from 'openid-client'
import {
  CreateUserEmail,
  FindEmail,
  FindEmailsByUserId,
  UpdateUserEmail
} from '@/modules/core/domain/userEmails/operations'
import { isWorkspaceRole, toLimitedWorkspace } from '@/modules/workspaces/domain/logic'
import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import { DeleteInvite, FindInvite } from '@/modules/serverinvites/domain/operations'
import { UpsertWorkspaceRole } from '@/modules/workspaces/domain/operations'
import { CreateValidatedUser } from '@/modules/core/domain/users/operations'
import {
  OidcProviderMissingGrantTypeError,
  SsoProviderExistsError,
  SsoProviderProfileInvalidError,
  SsoUserInviteRequiredError
} from '@/modules/workspaces/errors/sso'
import { WorkspaceInvalidRoleError } from '@/modules/workspaces/errors/workspace'
import { LimitedWorkspace } from '@/modules/workspacesCore/domain/types'
import {
  getEmailFromOidcProfile,
  isValidSsoSession
} from '@/modules/workspaces/domain/sso/logic'

// this probably should go a lean validation endpoint too
const validateOidcProviderAttributes = ({
  // client,
  issuer
}: OidcProviderAttributes): void => {
  if (!issuer.grantTypesSupported.includes('authorization_code'))
    throw new OidcProviderMissingGrantTypeError()
  /*
validate issuer:
authorization_signing_alg_values_supported
claims_supported: ['email', 'name', 'given_name', 'family_name']
scopes_supported: ['openid', 'profile', 'email']
grant_types_supported: ['authorization_code']
response_types_supported: //TODO figure out which

validate client:
grant_types: ['authorization_code'],

  */
}

/**
 * Store information about the OIDC provider used for a given SSO auth request.
 * Used by validation and auth
 */
export const startOidcSsoProviderValidationFactory =
  ({
    getOidcProviderAttributes,
    storeOidcProviderValidationRequest,
    generateCodeVerifier
  }: {
    getOidcProviderAttributes: GetOidcProviderAttributes
    storeOidcProviderValidationRequest: StoreOidcProviderValidationRequest
    generateCodeVerifier: () => string
  }) =>
  async ({ provider }: { provider: OidcProvider }): Promise<string> => {
    // get client information
    const providerAttributes = await getOidcProviderAttributes({ provider })
    // validate issuer and client data
    validateOidcProviderAttributes(providerAttributes)
    // store provider validation with an id token
    const codeVerifier = generateCodeVerifier()
    await storeOidcProviderValidationRequest({ token: codeVerifier, provider })
    return codeVerifier
  }

export const saveSsoProviderRegistrationFactory =
  ({
    getWorkspaceSsoProvider,
    storeProviderRecord,
    associateSsoProviderWithWorkspace
  }: {
    getWorkspaceSsoProvider: GetWorkspaceSsoProvider
    storeProviderRecord: StoreProviderRecord
    associateSsoProviderWithWorkspace: AssociateSsoProviderWithWorkspace
  }) =>
  async ({
    provider,
    workspaceId
  }: {
    provider: OidcProvider
    workspaceId: string
  }): Promise<OidcProviderRecord> => {
    // create OIDC provider record with ID
    const providerId = cryptoRandomString({ length: 10 })
    const providerRecord: OidcProviderRecord = {
      provider,
      providerType: 'oidc',
      createdAt: new Date(),
      updatedAt: new Date(),
      id: providerId
    }
    const maybeExistingSsoProvider = await getWorkspaceSsoProvider({ workspaceId })
    // replace with a proper error
    if (maybeExistingSsoProvider) throw new SsoProviderExistsError()
    await storeProviderRecord({ providerRecord })
    // associate provider with workspace
    await associateSsoProviderWithWorkspace({ workspaceId, providerId })
    return providerRecord
  }

export const createWorkspaceUserFromSsoProfileFactory =
  ({
    createUser,
    upsertWorkspaceRole,
    findInvite,
    deleteInvite
  }: {
    createUser: CreateValidatedUser
    upsertWorkspaceRole: UpsertWorkspaceRole
    findInvite: FindInvite
    deleteInvite: DeleteInvite
  }) =>
  async (args: {
    ssoProfile: UserinfoResponse<OidcProfile>
    workspaceId: string
  }): Promise<Pick<UserWithOptionalRole, 'id' | 'email'>> => {
    // Check if user has email-based invite to given workspace
    const invite = await findInvite({
      target: args.ssoProfile.email,
      resourceFilter: {
        resourceId: args.workspaceId,
        resourceType: 'workspace'
      }
    })

    if (!invite) {
      throw new SsoUserInviteRequiredError()
    }

    // Create Speckle user
    const { name } = args.ssoProfile
    const email = getEmailFromOidcProfile(args.ssoProfile)

    if (!name) {
      throw new SsoProviderProfileInvalidError('SSO provider user requires a name')
    }

    const newSpeckleUser = {
      name,
      email,
      verified: true,
      role: invite.resource.secondaryResourceRoles?.server
    }
    const newSpeckleUserId = await createUser(newSpeckleUser)

    // Add user to workspace with role specified in invite
    const { role: workspaceRole } = invite.resource

    if (!isWorkspaceRole(workspaceRole)) throw new WorkspaceInvalidRoleError()

    await upsertWorkspaceRole({
      userId: newSpeckleUserId,
      workspaceId: args.workspaceId,
      role: workspaceRole,
      createdAt: new Date()
    })

    // Delete invite (i.e. we implicitly "use" the invite during this sign up flow)
    await deleteInvite(invite.id)

    return {
      ...newSpeckleUser,
      id: newSpeckleUserId
    }
  }

export const linkUserWithSsoProviderFactory =
  ({
    findEmailsByUserId,
    createUserEmail,
    updateUserEmail
  }: {
    findEmailsByUserId: FindEmailsByUserId
    createUserEmail: CreateUserEmail
    updateUserEmail: UpdateUserEmail
  }) =>
  async (args: {
    userId: string
    ssoProfile: UserinfoResponse<OidcProfile>
  }): Promise<void> => {
    // TODO: Chuck's soapbox -
    //
    // Assert link between req.user.id & { providerId: decryptedOidcProvider.id, email: oidcProviderUserData.email }
    // Create link implicitly if req.context.userId exists (user performed SSO flow while signed in)
    // If req.context.userId does not exist, and link does not exist, throw and require user to sign in before SSO
    //
    // In addition, investigate using oidcProviderUserData.sub as source of truth here. Some providers appear to allow
    // `email` fields to change, or do not guarantee they will exist (Entra ID)

    // Add oidcProviderUserData.email to req.user.id verified emails, if not already present
    const userEmails = await findEmailsByUserId({ userId: args.userId })
    const maybeSsoEmail = userEmails.find(
      (entry) => entry.email === args.ssoProfile.email
    )

    if (!maybeSsoEmail) {
      await createUserEmail({
        userEmail: {
          userId: args.userId,
          email: getEmailFromOidcProfile(args.ssoProfile),
          verified: true
        }
      })
    }

    if (!!maybeSsoEmail && !maybeSsoEmail.verified) {
      await updateUserEmail({
        query: {
          id: maybeSsoEmail.id,
          userId: args.userId
        },
        update: {
          verified: true
        }
      })
    }
  }

export const listWorkspaceSsoMembershipsByUserEmailFactory =
  ({
    findEmail,
    listWorkspaceSsoMemberships
  }: {
    findEmail: FindEmail
    listWorkspaceSsoMemberships: ListWorkspaceSsoMemberships
  }) =>
  async (args: { userEmail: string }): Promise<LimitedWorkspace[]> => {
    const email = await findEmail({ email: args.userEmail })
    if (!email || !email.verified) return []

    const workspaces = await listWorkspaceSsoMemberships({ userId: email.userId })

    // Return limited workspace version of each workspace
    return workspaces.map(toLimitedWorkspace)
  }

export const listUserExpiredSsoSessionsFactory =
  ({
    listWorkspaceSsoMemberships,
    listUserSsoSessions
  }: {
    listWorkspaceSsoMemberships: ListWorkspaceSsoMemberships
    listUserSsoSessions: ListUserSsoSessions
  }) =>
  async (args: { userId: string }): Promise<LimitedWorkspace[]> => {
    const workspaces = await listWorkspaceSsoMemberships({ userId: args.userId })
    const sessions = await listUserSsoSessions({ userId: args.userId })

    const validSessions = sessions.filter(isValidSsoSession)

    return workspaces
      .filter(
        (workspace) =>
          !validSessions.some((session) => session.workspaceId === workspace.id)
      )
      .map(toLimitedWorkspace)
  }

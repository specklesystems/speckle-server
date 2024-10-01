import {
  GetOIDCProviderAttributes,
  OIDCProviderAttributes,
  OIDCProvider,
  StoreOIDCProviderValidationRequest,
  StoreProviderRecord,
  StoreUserSsoSession,
  OIDCProviderRecord,
  AssociateSsoProviderWithWorkspace,
  GetWorkspaceSsoProvider
} from '@/modules/workspaces/domain/sso'
import { BaseError } from '@/modules/shared/errors/base'
import cryptoRandomString from 'crypto-random-string'
import { CreateUserEmail } from '@/modules/core/domain/userEmails/operations'

export class MissingOIDCProviderGrantType extends BaseError {
  static defaultMessage = 'OIDC issuer does not support authorization_code grant type'
  static code = 'OIDC_SSO_MISSING_GRANT_TYPE'
  static statusCode = 400
}

// this probably should go a lean validation endpoint too
const validateOIDCProviderAttributes = ({
  // client,
  issuer
}: OIDCProviderAttributes): void => {
  if (!issuer.grantTypesSupported.includes('authorization_code'))
    throw new MissingOIDCProviderGrantType()
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

export const startOIDCSsoProviderValidationFactory =
  ({
    getOIDCProviderAttributes,
    storeOIDCProviderValidationRequest,
    generateCodeVerifier
  }: {
    getOIDCProviderAttributes: GetOIDCProviderAttributes
    storeOIDCProviderValidationRequest: StoreOIDCProviderValidationRequest
    generateCodeVerifier: () => string
  }) =>
  async ({ provider }: { provider: OIDCProvider }): Promise<string> => {
    // get client information
    const providerAttributes = await getOIDCProviderAttributes({ provider })
    // validate issuer and client data
    validateOIDCProviderAttributes(providerAttributes)
    // store provider validation with an id token
    const codeVerifier = generateCodeVerifier()
    await storeOIDCProviderValidationRequest({ token: codeVerifier, provider })
    return codeVerifier
  }

export const saveSsoProviderRegistrationFactory =
  ({
    getWorkspaceSsoProvider,
    storeProviderRecord,
    associateSsoProviderWithWorkspace,
    storeUserSsoSession
  }: // createUserEmail
  {
    getWorkspaceSsoProvider: GetWorkspaceSsoProvider
    storeProviderRecord: StoreProviderRecord
    associateSsoProviderWithWorkspace: AssociateSsoProviderWithWorkspace
    storeUserSsoSession: StoreUserSsoSession
    createUserEmail: CreateUserEmail
  }) =>
  async ({
    provider,
    workspaceId,
    userId
  }: // ssoProviderUserInfo
  {
    provider: OIDCProvider
    userId: string
    workspaceId: string
    // ssoProviderUserInfo: { email: string }
  }) => {
    // create OIDC provider record with ID
    const providerId = cryptoRandomString({ length: 10 })
    const providerRecord: OIDCProviderRecord = {
      provider,
      providerType: 'oidc',
      createdAt: new Date(),
      updatedAt: new Date(),
      id: providerId
    }
    const maybeExistingSsoProvider = await getWorkspaceSsoProvider({ workspaceId })
    // replace with a proper error
    if (maybeExistingSsoProvider)
      throw new Error('Workspace already has an SSO provider')
    await storeProviderRecord({ providerRecord })
    // associate provider with workspace
    await associateSsoProviderWithWorkspace({ workspaceId, providerId })
    // create and associate userSso session (how long is the default validity?)
    // BTW there is a bit of an issue with PATs and sso sessions, if the session expires, the PAT fails to work
    const lifespan = 6.048e8 // 1 week
    await storeUserSsoSession({
      userSsoSession: { createdAt: new Date(), userId, providerId, lifespan }
    })
    // 1. get userId's emails

    // 2. if the ssoUserInfoEmail is not in the user's emails, add it as verified
    // 3. if its in the emails, but not verify, verify it
    // 4. if its verified, do nothing
    // await createUserEmail()
  }

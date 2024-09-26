import {
  GetOIDCProviderAttributes,
  OIDCProviderAttributes,
  OIDCProvider,
  StoreOIDCProviderValidationRequest,
  GetOIDCProviderData,
  GetOIDCUserData,
  OIDCCallbackParams
} from '@/modules/workspaces/domain/sso'
import { BaseError } from '@/modules/shared/errors/base'
import { generators } from 'openid-client'

export class MissingOIDCProviderGrantType extends BaseError {
  static defaultMessage = 'OIDC issuer does not support authorization_code grant type'
  static code = 'OIDC_SSO_MISSING_GRANT_TYPE'
  static statusCode = 400
}

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

export const finishOIDCSsoProviderValidationFactory =
  ({
    getOIDCProviderData,
    getOIDCUserData
  }: {
    getOIDCProviderData: GetOIDCProviderData
    getOIDCUserData: GetOIDCUserData
  }) =>
  async ({
    issuer,
    validationToken,
    callbackParams
  }: {
    issuer: string
    validationToken: string
    callbackParams: OIDCCallbackParams
  }): Promise<boolean> => {
    //get stored provider validation request
    // throw error if not found
    return true
  }

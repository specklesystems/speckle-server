import { AuthError } from './authErrors.js'
import { AuthResult } from './authResult.js'
import { AuthCheckContextLoaderKeys, AuthCheckContextLoaders } from './loaders.js'

export type ProjectContext = { projectId: string }

export type UserContext = { userId?: string }

export type AuthPolicyFactory<
  LoaderKeys extends AuthCheckContextLoaderKeys,
  Args extends object,
  ExpectedAuthErrors extends AuthError
> = (
  loaders: AuthCheckContextLoaders<LoaderKeys>
) => (args: Args) => Promise<AuthResult<ExpectedAuthErrors>>

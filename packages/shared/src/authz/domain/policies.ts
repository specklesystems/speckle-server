import Result from 'true-myth/result'
import { AuthError } from './authErrors.js'
import { AuthCheckContextLoaderKeys, AuthCheckContextLoaders } from './loaders.js'

export type ProjectContext = { projectId: string }

export type UserContext = { userId?: string }

export type AuthPolicyFactory<
  LoaderKeys extends AuthCheckContextLoaderKeys,
  Args extends object,
  ExpectedAuthErrors extends AuthError
> = (
  loaders: AuthCheckContextLoaders<LoaderKeys>
) => (args: Args) => Promise<Result<true, ExpectedAuthErrors>>

import Result from 'true-myth/result'
import { AuthCheckContextLoaderKeys, AuthCheckContextLoaders } from './loaders.js'
import { AuthError } from './authErrors.js'

export type ProjectContext = { projectId: string }

export type UserContext = { userId?: string }

export type AuthPolicyFactory<
  LoaderKeys extends AuthCheckContextLoaderKeys,
  Args extends object,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ExpectedAuthErrors extends AuthError<any, any>
> = (
  loaders: AuthCheckContextLoaders<LoaderKeys>
) => (args: Args) => Promise<Result<true, ExpectedAuthErrors>>

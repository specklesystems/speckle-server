import Result from 'true-myth/result'
import Unit from 'true-myth/unit'
import { AuthError } from './authErrors.js'
import { AuthCheckContextLoaderKeys, AuthCheckContextLoaders } from './loaders.js'
import Maybe from 'true-myth/maybe'

export type ProjectContext = { projectId: string }
export type UserContext = { userId: string }
export type MaybeUserContext = { userId?: string }
export type WorkspaceContext = { workspaceId: string }

// a complete policy always returns a full result
export type AuthPolicy<
  LoaderKeys extends AuthCheckContextLoaderKeys,
  Args extends object,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ExpectedAuthErrors extends AuthError<any, any>
> = (
  loaders: AuthCheckContextLoaders<LoaderKeys>
) => (args: Args) => Promise<Result<Unit, ExpectedAuthErrors>>

// a policy fragment is a partial policy, where it can potentially make a decision
// but maybe it cannot
export type AuthPolicyFragment<
  LoaderKeys extends AuthCheckContextLoaderKeys,
  Args extends object,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ExpectedAuthErrors extends AuthError<any, any>
> = (
  loaders: AuthCheckContextLoaders<LoaderKeys>
) => (args: Args) => Promise<Maybe<Result<Unit, ExpectedAuthErrors>>>

export type AuthPolicyCheck<
  LoaderKeys extends AuthCheckContextLoaderKeys,
  Args extends object
> = (loaders: AuthCheckContextLoaders<LoaderKeys>) => (args: Args) => Promise<boolean>

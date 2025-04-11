/* eslint-disable @typescript-eslint/no-explicit-any */
import Result from 'true-myth/result'
import Unit from 'true-myth/unit'
import { AllAuthErrors, AuthError } from './authErrors.js'
import { AuthCheckContextLoaderKeys, AuthCheckContextLoaders } from './loaders.js'

export type AuthPolicyResult<
  ExpectedAuthErrors extends AuthError<any, any> = AllAuthErrors
> = Result<Unit, ExpectedAuthErrors>

// a complete policy always returns a full result
export type AuthPolicy<
  LoaderKeys extends AuthCheckContextLoaderKeys,
  Args extends object,
  ExpectedAuthErrors extends AuthError<any, any>
> = (
  loaders: AuthCheckContextLoaders<LoaderKeys>
) => (args: Args) => Promise<Result<Unit, ExpectedAuthErrors>>

export type AuthPolicyFragment<
  LoaderKeys extends AuthCheckContextLoaderKeys,
  Args extends object,
  ExpectedAuthErrors extends AuthError<any, any>,
  Return
> = (
  loaders: AuthCheckContextLoaders<LoaderKeys>
) => (args: Args) => Promise<Result<Return, ExpectedAuthErrors>>

export type AuthPolicyEnsureFragment<
  LoaderKeys extends AuthCheckContextLoaderKeys,
  Args extends object,
  ExpectedAuthErrors extends AuthError<any, any>
> = AuthPolicyFragment<LoaderKeys, Args, ExpectedAuthErrors, Unit>

export type AuthPolicyCheckFragment<
  LoaderKeys extends AuthCheckContextLoaderKeys,
  Args extends object,
  ExpectedAuthErrors extends AuthError<any, any>
> = AuthPolicyFragment<LoaderKeys, Args, ExpectedAuthErrors, boolean>

export type AuthPolicyCheck<
  LoaderKeys extends AuthCheckContextLoaderKeys,
  Args extends object
> = (loaders: AuthCheckContextLoaders<LoaderKeys>) => (args: Args) => Promise<boolean>

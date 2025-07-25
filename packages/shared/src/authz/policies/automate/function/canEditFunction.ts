import { err, ok } from 'true-myth/result'
import {
  AutomateFunctionNotCreatorError,
  AutomateFunctionNotFoundError,
  AutomateNotEnabledError
} from '../../../domain/authErrors.js'
import { AutomateFunctionContext, MaybeUserContext } from '../../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../../domain/loaders.js'
import { AuthPolicy } from '../../../domain/policies.js'
import {
  ensureAutomateEnabledFragment,
  ensureAutomateFunctionCreatorFragment
} from '../../../fragments/automate.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getAutomateFunction

type PolicyArgs = MaybeUserContext & AutomateFunctionContext

type PolicyErrors = InstanceType<
  | typeof AutomateNotEnabledError
  | typeof AutomateFunctionNotFoundError
  | typeof AutomateFunctionNotCreatorError
>

export const canEditFunctionPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, functionId }) => {
    const isAutomateEnabled = await ensureAutomateEnabledFragment(loaders)({})
    if (isAutomateEnabled.isErr) return err(isAutomateEnabled.error)

    const isAutomateFunctionCreator = await ensureAutomateFunctionCreatorFragment(
      loaders
    )({
      userId,
      functionId
    })
    if (isAutomateFunctionCreator.isErr) return err(isAutomateFunctionCreator.error)

    return ok()
  }

import { err, ok } from 'true-myth/result'
import {
  AutomateFunctionNotCreatorError,
  AutomateFunctionNotFoundError,
  AutomateNotEnabledError
} from '../domain/authErrors.js'
import { Loaders } from '../domain/loaders.js'
import { AuthPolicyEnsureFragment } from '../domain/policies.js'
import { AutomateFunctionContext, MaybeUserContext } from '../domain/context.js'

export const ensureAutomateEnabledFragment: AuthPolicyEnsureFragment<
  typeof Loaders.getEnv,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  InstanceType<typeof AutomateNotEnabledError>
> = (loaders) => async () => {
  const env = await loaders.getEnv()
  if (!env.FF_AUTOMATE_MODULE_ENABLED) return err(new AutomateNotEnabledError())
  return ok()
}

export const ensureAutomateFunctionCreatorFragment: AuthPolicyEnsureFragment<
  typeof Loaders.getAutomateFunction,
  MaybeUserContext & AutomateFunctionContext,
  InstanceType<
    typeof AutomateFunctionNotFoundError | typeof AutomateFunctionNotCreatorError
  >
> =
  (loaders) =>
  async ({ userId, functionId }) => {
    const automateFunction = await loaders.getAutomateFunction({ functionId })
    if (!automateFunction) return err(new AutomateFunctionNotFoundError())
    if (!userId || automateFunction.functionCreator?.speckleUserId !== userId)
      return err(new AutomateFunctionNotCreatorError())
    return ok()
  }

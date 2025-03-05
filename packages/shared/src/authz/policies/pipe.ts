import { AuthFunction, AuthFunctionArgs, AuthResult } from "./types.js";

export const authPipelineFactory = (authFunctions: AuthFunction[]) => async (args: AuthFunctionArgs): Promise<AuthResult> => {
  for (const authFunction of authFunctions) {
    const result = await authFunction(args)
    if (result === null) continue

    return result
      ? {
        authorized: true
      }
      : {
        authorized: false,
        reason: 'foo'
      }
  }

  // TODO: Is it right to default to true?
  return { authorized: true }
}
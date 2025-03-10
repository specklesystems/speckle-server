import { AuthFunction, AuthFunctionArgs, AuthResult } from '../domain/types.js'

export const pipelineBuilder =
  (authSteps: AuthFunction[]) =>
  async (args: AuthFunctionArgs): Promise<AuthResult> => {
    for (const step of authSteps) {
      const result = await step(args)
      if (result === null) continue
      return result
    }

    // TODO: Is it right to default to true?
    return { authorized: true }
  }

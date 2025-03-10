import { AuthFunction } from '../domain/types.js'

export const continueIfFalse =
  (step: AuthFunction): AuthFunction =>
  async (args) => {
    const result = await step(args)
    return result?.authorized === false ? null : result
  }

export const continueIfTrue =
  (step: AuthFunction): AuthFunction =>
  async (args) => {
    const result = await step(args)
    return result?.authorized === true ? null : result
  }

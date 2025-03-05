import { ProjectRole, ServerRole } from "./domain.js";
import { AuthFunction } from "./types.js";

export const continueIfTrue = (step: AuthFunction): AuthFunction => async (args) => {
  const result = await step(args)
  return result === true ? null : result
}

export const continueIfFalse = (step: AuthFunction): AuthFunction => async (args) => {
  const result = await step(args)
  return result === false ? null : result
}

export const isMinimumServerRole = (role: ServerRole, target: ServerRole): boolean => {
  // TODO: Actually implement/copy
  return role === target
}

export const isMinimumProjectRole = (role: ProjectRole, target: ProjectRole): boolean => {
  // TODO: Actually implement/copy
  return role === target
}
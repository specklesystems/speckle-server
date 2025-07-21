import { defineModuleLoaders } from '@/modules/loaders'
import { LoaderUnsupportedError } from '@/modules/shared/errors'

export default defineModuleLoaders(() => ({
  getAutomateFunction: async () => null,
  getWorkspace: async () => {
    throw new LoaderUnsupportedError()
  },
  getWorkspaceRole: async () => {
    throw new LoaderUnsupportedError()
  },
  getWorkspaceSsoSession: async () => {
    throw new LoaderUnsupportedError()
  },
  getWorkspaceSsoProvider: async () => {
    throw new LoaderUnsupportedError()
  },
  getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async () => {
    throw new LoaderUnsupportedError()
  },
  getWorkspaceSeat: async () => {
    throw new LoaderUnsupportedError()
  },
  getWorkspaceModelCount: async () => {
    throw new LoaderUnsupportedError()
  },
  getWorkspaceProjectCount: async () => {
    throw new LoaderUnsupportedError()
  },
  getWorkspacePlan: async () => {
    throw new LoaderUnsupportedError()
  },
  getWorkspaceLimits: async () => {
    throw new LoaderUnsupportedError()
  }
}))

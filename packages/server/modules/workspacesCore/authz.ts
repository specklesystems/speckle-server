import { defineLoaders } from '@/modules/loaders'
import { LoaderUnsupportedError } from '@/modules/shared/errors'

export const defineModuleLoaders = () => {
  defineLoaders({
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
    }
  })
}

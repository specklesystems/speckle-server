import { RequestDataLoaders } from '@/modules/core/loaders'
import { MaybeAsync } from '@speckle/shared'
import { AuthCheckContextLoaders } from '@speckle/shared/authz'

export type ServerLoadersContext = {
  dataLoaders: RequestDataLoaders
}

// Inject extra argument to all loaders, e.g. for GQL dataloaders
export type ServerLoaders = Partial<{
  [K in keyof AuthCheckContextLoaders]: AuthCheckContextLoaders[K] extends (
    ...args: infer A
  ) => infer R
    ? (...args: [...A, ctx: ServerLoadersContext]) => R
    : never
}>

// define being an arg simplifes usage in export default calls
export const defineModuleLoaders = (define: () => MaybeAsync<ServerLoaders>) => {
  return async () => await define()
}

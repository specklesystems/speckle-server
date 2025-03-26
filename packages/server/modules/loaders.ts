import { Authz, MaybeAsync } from '@speckle/shared'

// define being an arg simplifes usage in export default calls
export const defineModuleLoaders = (
  define: () => MaybeAsync<Partial<Authz.AuthCheckContextLoaders>>
) => {
  return async () => await define()
}

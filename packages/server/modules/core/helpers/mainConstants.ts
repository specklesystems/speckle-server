import { Roles, Scopes, AllScopes as BaseAllScopes, Environment } from '@speckle/shared'

const { FF_AUTOMATE_MODULE_ENABLED } = Environment.getFeatureFlags()

const AllScopes = FF_AUTOMATE_MODULE_ENABLED
  ? BaseAllScopes
  : BaseAllScopes.filter(
      (s: string) =>
        !(
          [Scopes.AutomateFunctions.Read, Scopes.AutomateFunctions.Write] as string[]
        ).includes(s)
    )

export type { ServerRoles, StreamRoles } from '@speckle/shared'
export { Roles, Scopes, AllScopes }

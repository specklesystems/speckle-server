import { Roles, Scopes, AllScopes as BaseAllScopes } from '@speckle/shared'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_AUTOMATE_MODULE_ENABLED } = getFeatureFlags()

const AllScopes = FF_AUTOMATE_MODULE_ENABLED
  ? BaseAllScopes
  : BaseAllScopes.filter(
      (s: string) =>
        !(
          [
            Scopes.AutomateFunctions.Read,
            Scopes.AutomateFunctions.Write,
            Scopes.Automate.ReportResults
          ] as string[]
        ).includes(s)
    )

export type { ServerRoles, StreamRoles } from '@speckle/shared'
export { Roles, Scopes, AllScopes }

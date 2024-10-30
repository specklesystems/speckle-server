import { Roles, Scopes, AllScopes as BaseAllScopes } from '@speckle/shared'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const {
  FF_AUTOMATE_MODULE_ENABLED,
  FF_WORKSPACES_MODULE_ENABLED,
  FF_GATEKEEPER_MODULE_ENABLED
} = getFeatureFlags()

const buildAllScopes = () => {
  let base = BaseAllScopes

  if (!FF_AUTOMATE_MODULE_ENABLED) {
    base = base.filter(
      (s: string) =>
        !(
          [
            Scopes.AutomateFunctions.Read,
            Scopes.AutomateFunctions.Write,
            Scopes.Automate.ReportResults
          ] as string[]
        ).includes(s)
    )
  }

  if (!FF_WORKSPACES_MODULE_ENABLED) {
    base = base.filter(
      (s: string) =>
        !(
          [
            Scopes.Workspaces.Create,
            Scopes.Workspaces.Read,
            Scopes.Workspaces.Update,
            Scopes.Workspaces.Delete
          ] as string[]
        ).includes(s)
    )
  }

  if (!FF_GATEKEEPER_MODULE_ENABLED) {
    base = base.filter(
      (s: string) => !([Scopes.Gatekeeper.WorkspaceBilling] as string[]).includes(s)
    )
  }
  return base
}

const AllScopes = buildAllScopes()

export type { ServerRoles, StreamRoles } from '@speckle/shared'
export { Roles, Scopes, AllScopes }

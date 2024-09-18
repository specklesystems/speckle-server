import { getDefaultApps } from '@/modules/auth/defaultApps'
import {
  GetAllScopes,
  GetApp,
  InitializeDefaultApps,
  RegisterDefaultApp,
  UpdateDefaultApp
} from '@/modules/auth/domain/operations'
import { ScopeRecord } from '@/modules/auth/helpers/types'
import { ServerScope } from '@speckle/shared'

/**
 * Cached all scopes. Caching occurs on first initializeDefaultApps() call
 */
let allScopes: ScopeRecord[] = []

export const initializeDefaultAppsFactory =
  (deps: {
    getAllScopes: GetAllScopes
    getApp: GetApp
    updateDefaultApp: UpdateDefaultApp
    registerDefaultApp: RegisterDefaultApp
  }): InitializeDefaultApps =>
  async () => {
    allScopes = await deps.getAllScopes()

    await Promise.all(
      getDefaultApps().map(async (app) => {
        const scopes =
          app?.scopes === 'all'
            ? allScopes.map((s) => s.name)
            : (app.scopes as ServerScope[])

        const existingApp = await deps.getApp({ id: app.id })
        if (existingApp) {
          await deps.updateDefaultApp(
            {
              ...app,
              scopes
            },
            existingApp
          )
        } else {
          await deps.registerDefaultApp({
            ...app,
            scopes
          })
        }
      })
    )
  }

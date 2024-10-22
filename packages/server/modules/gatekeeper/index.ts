import { moduleLogger } from '@/logging/logging'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { validateModuleLicense } from '@/modules/gatekeeper/services/validateLicense'
import { getBillingRouter } from '@/modules/gatekeeper/rest/billing'
import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import { db } from '@/db/knex'
import { gatekeeperScopes } from '@/modules/gatekeeper/scopes'

const { FF_GATEKEEPER_MODULE_ENABLED, FF_BILLING_INTEGRATION_ENABLED } =
  getFeatureFlags()

const initScopes = async () => {
  const registerFunc = registerOrUpdateScopeFactory({ db })
  await Promise.all(gatekeeperScopes.map((scope) => registerFunc({ scope })))
}

const gatekeeperModule: SpeckleModule = {
  async init(app, isInitial) {
    await initScopes()
    if (!FF_GATEKEEPER_MODULE_ENABLED) return

    const isLicenseValid = await validateModuleLicense({
      requiredModules: ['gatekeeper']
    })
    if (!isLicenseValid)
      throw new Error(
        'The gatekeeper module needs a valid license to run, contact Speckle to get one.'
      )

    moduleLogger.info('🗝️  Init gatekeeper module')

    if (isInitial) {
      // TODO: need to subscribe to the workspaceCreated event and store the workspacePlan as a trial if billing enabled, else store as unlimited
      if (FF_BILLING_INTEGRATION_ENABLED) {
        app.use(getBillingRouter())

        const isLicenseValid = await validateModuleLicense({
          requiredModules: ['billing']
        })
        if (!isLicenseValid)
          throw new Error(
            'The the billing module needs a valid license to run, contact Speckle to get one.'
          )
        // TODO: create a cron job, that removes unused seats from the subscription at the beginning of each workspace plan's billing cycle
      }
    }
  }
}
export = gatekeeperModule

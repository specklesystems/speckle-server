import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { validateModuleLicense } from '@/modules/gatekeeper/services/validateLicense'
import billingRouter from '@/modules/gatekeeper/rest/billing'

const { FF_GATEKEEPER_MODULE_ENABLED, FF_BILLING_INTEGRATION_ENABLED } =
  getFeatureFlags()

const gatekeeperModule: SpeckleModule = {
  async init(app, isInitial) {
    if (!FF_GATEKEEPER_MODULE_ENABLED) return

    const isLicenseValid = await validateModuleLicense({
      requiredModules: ['gatekeeper']
    })
    if (!isLicenseValid)
      throw new Error(
        'The gatekeeper module needs a valid license to run, contact Speckle to get one.'
      )

    if (isInitial) {
      if (FF_BILLING_INTEGRATION_ENABLED) app.use(billingRouter)
      // TODO: need to subscribe to the workspaceCreated event and store the workspacePlan as a trial if billing enabled, else store as unlimited
      // TODO: create a cron job, that removes unused seats from the subscription at the beginning of each workspace plan's billing cycle
    }
  }
}
export = gatekeeperModule

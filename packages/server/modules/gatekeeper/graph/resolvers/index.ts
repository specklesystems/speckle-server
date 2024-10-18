import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { pricingTable } from '@/modules/gatekeeper/domain/workspacePricing'

const { FF_GATEKEEPER_MODULE_ENABLED } = getFeatureFlags()

export = FF_GATEKEEPER_MODULE_ENABLED
  ? ({
      Query: {
        workspacePricingPlans: async () => {
          return pricingTable
        }
      }
    } as Resolvers)
  : {}

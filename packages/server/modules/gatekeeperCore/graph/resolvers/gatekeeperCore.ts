import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_GATEKEEPER_MODULE_ENABLED } = getFeatureFlags()

export = !FF_GATEKEEPER_MODULE_ENABLED
  ? ({
      Workspace: {
        readOnly: async () => {
          return false
        }
      }
    } as Resolvers)
  : {}

import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { GatekeeperModuleDisabledError } from '@/modules/gatekeeperCore/errors'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_GATEKEEPER_MODULE_ENABLED } = getFeatureFlags()

const resolvers: Resolvers = FF_GATEKEEPER_MODULE_ENABLED
  ? {}
  : {
      WorkspaceMutations: {
        billing: () => {
          throw new GatekeeperModuleDisabledError()
        },
        updateSeatType: () => {
          throw new GatekeeperModuleDisabledError()
        }
      },
      WorkspaceCollaborator: {
        seatType: () => {
          throw new GatekeeperModuleDisabledError()
        }
      },
      ServerWorkspacesInfo: {
        planPrices: () => []
      }
    }

export default resolvers

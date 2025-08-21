import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { GatekeeperModuleDisabledError } from '@/modules/gatekeeperCore/errors'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_GATEKEEPER_MODULE_ENABLED } = getFeatureFlags()

const resolvers: Resolvers = FF_GATEKEEPER_MODULE_ENABLED
  ? {}
  : {
      Workspace: {
        defaultSeatType: () => 'viewer'
      },
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
      ProjectCollaborator: {
        seatType: () => {
          throw new GatekeeperModuleDisabledError()
        }
      },
      ServerWorkspacesInfo: {
        planPrices: () => null
      },
      Project: {
        hasAccessToFeature: () => {
          return false
        }
      }
    }

export default resolvers

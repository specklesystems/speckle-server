import { getFeatureFlags, getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { pricingTable } from '@/modules/gatekeeper/domain/workspacePricing'
import { authorizeResolver } from '@/modules/shared'
import { Roles } from '@speckle/shared'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { db } from '@/db/knex'
import { createCheckoutSessionFactory } from '@/modules/gatekeeper/clients/stripe'
import { getWorkspacePlanPrice, stripe } from '@/modules/gatekeeper/stripe'
import { startCheckoutSessionFactory } from '@/modules/gatekeeper/services/checkout'
import {
  deleteCheckoutSessionFactory,
  getWorkspaceCheckoutSessionFactory,
  getWorkspacePlanFactory,
  saveCheckoutSessionFactory
} from '@/modules/gatekeeper/repositories/billing'

const { FF_GATEKEEPER_MODULE_ENABLED } = getFeatureFlags()

export = FF_GATEKEEPER_MODULE_ENABLED
  ? ({
      Query: {
        workspacePricingPlans: async () => {
          return pricingTable
        }
      },
      WorkspaceMutations: () => ({}),
      WorkspaceBillingMutations: {
        cancelCheckoutSession: async (parent, args, ctx) => {
          const { workspaceId, sessionId } = args.input

          await authorizeResolver(
            ctx.userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )
          await deleteCheckoutSessionFactory({ db })({ checkoutSessionId: sessionId })
          return true
        },
        createCheckoutSession: async (parent, args, ctx) => {
          const { workspaceId, workspacePlan, billingInterval } = args.input
          const workspace = await getWorkspaceFactory({ db })({ workspaceId })

          if (!workspace) throw new WorkspaceNotFoundError()

          await authorizeResolver(
            ctx.userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )

          const createCheckoutSession = createCheckoutSessionFactory({
            stripe,
            frontendOrigin: getFrontendOrigin(),
            getWorkspacePlanPrice
          })

          const countRole = countWorkspaceRoleWithOptionalProjectRoleFactory({ db })

          const session = await startCheckoutSessionFactory({
            getWorkspaceCheckoutSession: getWorkspaceCheckoutSessionFactory({ db }),
            getWorkspacePlan: getWorkspacePlanFactory({ db }),
            countRole,
            createCheckoutSession,
            saveCheckoutSession: saveCheckoutSessionFactory({ db }),
            deleteCheckoutSession: deleteCheckoutSessionFactory({ db })
          })({
            workspacePlan,
            workspaceId,
            workspaceSlug: workspace.slug,
            billingInterval
          })

          return session
        }
      }
    } as Resolvers)
  : {}

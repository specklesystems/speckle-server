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
import {
  createCheckoutSessionFactory,
  createCustomerPortalUrlFactory
} from '@/modules/gatekeeper/clients/stripe'
import { getWorkspacePlanPrice, getStripeClient } from '@/modules/gatekeeper/stripe'
import { startCheckoutSessionFactory } from '@/modules/gatekeeper/services/checkout'
import {
  deleteCheckoutSessionFactory,
  getWorkspaceCheckoutSessionFactory,
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory,
  saveCheckoutSessionFactory
} from '@/modules/gatekeeper/repositories/billing'
import { canWorkspaceAccessFeatureFactory } from '@/modules/gatekeeper/services/featureAuthorization'

const { FF_GATEKEEPER_MODULE_ENABLED } = getFeatureFlags()

export = FF_GATEKEEPER_MODULE_ENABLED
  ? ({
      Query: {
        workspacePricingPlans: async () => {
          return pricingTable
        }
      },
      Workspace: {
        plan: async (parent) => {
          return await getWorkspacePlanFactory({ db })({ workspaceId: parent.id })
        },
        subscription: async (parent, _, ctx) => {
          const workspaceId = parent.id
          await authorizeResolver(
            ctx.userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )
          return await getWorkspaceSubscriptionFactory({ db })({ workspaceId })
        },
        customerPortalUrl: async (parent, _, ctx) => {
          const workspaceId = parent.id
          await authorizeResolver(
            ctx.userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )
          const workspaceSubscription = await getWorkspaceSubscriptionFactory({ db })({
            workspaceId
          })
          if (!workspaceSubscription) return null
          const workspace = await getWorkspaceFactory({ db })({ workspaceId })
          if (!workspace)
            throw new Error('This cannot be, if there is a sub, there is a workspace')
          return await createCustomerPortalUrlFactory({
            stripe: getStripeClient(),
            frontendOrigin: getFrontendOrigin()
          })({
            workspaceId: workspaceSubscription.workspaceId,
            workspaceSlug: workspace.slug,
            customerId: workspaceSubscription.subscriptionData.customerId
          })
        },
        hasAccessToFeature: async (parent, args, ctx) => {
          await authorizeResolver(
            ctx.userId,
            parent.id,
            Roles.Workspace.Member,
            ctx.resourceAccessRules
          )
          const hasAccess = await canWorkspaceAccessFeatureFactory({
            getWorkspacePlan: getWorkspacePlanFactory({ db })
          })({
            workspaceId: parent.id,
            workspaceFeature: args.featureName
          })
          return hasAccess
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
            stripe: getStripeClient(),
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

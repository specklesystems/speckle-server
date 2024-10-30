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
  createCustomerPortalUrlFactory,
  reconcileWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/clients/stripe'
import {
  getWorkspacePlanPrice,
  getStripeClient,
  getWorkspacePlanProductId,
  getWorkspaceProductPrice
} from '@/modules/gatekeeper/stripe'
import { startCheckoutSessionFactory } from '@/modules/gatekeeper/services/checkout'
import {
  deleteCheckoutSessionFactory,
  getWorkspaceCheckoutSessionFactory,
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory,
  saveCheckoutSessionFactory,
  upsertWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/repositories/billing'
import { commandFactory } from '@/modules/shared/command'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { upgradeWorkspacePlanFactory } from '@/modules/gatekeeper/services/subscriptions'

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
        },
        upgradeWorkspacePlan: async (parent, args, ctx) => {
          const { billingInterval, workspacePlan, workspaceId } = args.input
          authorizeResolver(
            ctx.userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )
          return await commandFactory({
            db,
            eventBus: getEventBus(),
            operationFactory: ({ db }) =>
              upgradeWorkspacePlanFactory({
                getWorkspacePlan: getWorkspacePlanFactory({ db }),
                getWorkspacePlanPrice,
                getWorkspacePlanProductId,
                getWorkspaceProductPrice,
                getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
                reconcileSubscriptionData: reconcileWorkspaceSubscriptionFactory({
                  stripe: getStripeClient()
                }),
                updateWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({ db })
              })
          })({ workspaceId, billingInterval, workspacePlan })
        }
      }
    } as Resolvers)
  : {}

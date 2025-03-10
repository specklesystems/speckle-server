import { getFeatureFlags, getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { authorizeResolver } from '@/modules/shared'
import { ensureError, Roles, throwUncoveredError } from '@speckle/shared'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { db } from '@/db/knex'
import {
  createCustomerPortalUrlFactory,
  getRecurringPricesFactory,
  reconcileWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/clients/stripe'
import {
  getWorkspacePlanPriceId,
  getStripeClient,
  getWorkspacePlanProductId,
  getWorkspacePlanProductAndPriceIds
} from '@/modules/gatekeeper/stripe'
import {
  deleteCheckoutSessionFactory,
  getWorkspaceCheckoutSessionFactory,
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory,
  saveCheckoutSessionFactory,
  upsertPaidWorkspacePlanFactory,
  upsertWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/repositories/billing'
import { canWorkspaceAccessFeatureFactory } from '@/modules/gatekeeper/services/featureAuthorization'
import { upgradeWorkspaceSubscriptionFactory } from '@/modules/gatekeeper/services/subscriptions'
import { isWorkspaceReadOnlyFactory } from '@/modules/gatekeeper/services/readOnly'
import {
  calculateSubscriptionSeats,
  CreateCheckoutSession,
  CreateCheckoutSessionOld
} from '@/modules/gatekeeper/domain/billing'
import { WorkspacePaymentMethod } from '@/test/graphql/generated/graphql'
import { LogicError, NotImplementedError } from '@/modules/shared/errors'
import { isNewPlanType } from '@/modules/gatekeeper/helpers/plans'
import { getWorkspacePlanProductPricesFactory } from '@/modules/gatekeeper/services/prices'
import { extendLoggerComponent } from '@/observability/logging'
import { OperationName, OperationStatus } from '@/observability/domain/fields'
import { logWithErr } from '@/observability/utils/logLevels'
import {
  createCheckoutSessionFactoryNew,
  createCheckoutSessionFactoryOld
} from '@/modules/gatekeeper/clients/checkout/createCheckoutSession'
import {
  startCheckoutSessionFactoryNew,
  startCheckoutSessionFactoryOld
} from '@/modules/gatekeeper/services/checkout/startCheckoutSession'
import { countSeatsByTypeInWorkspaceFactory } from '@/modules/gatekeeper/repositories/workspaceSeat'

const { FF_GATEKEEPER_MODULE_ENABLED, FF_BILLING_INTEGRATION_ENABLED } =
  getFeatureFlags()

const getWorkspacePlan = getWorkspacePlanFactory({ db })

async function shouldUseNewCheckoutFlow(workspaceId: string) {
  const workspacePlan = await getWorkspacePlan({ workspaceId })
  return workspacePlan && isNewPlanType(workspacePlan.name)
}

export = FF_GATEKEEPER_MODULE_ENABLED
  ? ({
      Workspace: {
        plan: async (parent) => {
          const workspacePlan = await getWorkspacePlanFactory({ db })({
            workspaceId: parent.id
          })
          if (!workspacePlan) return null
          let paymentMethod: WorkspacePaymentMethod
          switch (workspacePlan.name) {
            case 'starter':
            case 'plus':
            case 'business':
            case 'team':
            case 'pro':
              paymentMethod = WorkspacePaymentMethod.Billing
              break
            case 'unlimited':
            case 'academia':
            case 'free':
              paymentMethod = WorkspacePaymentMethod.Unpaid
              break
            case 'starterInvoiced':
            case 'plusInvoiced':
            case 'businessInvoiced':
              paymentMethod = WorkspacePaymentMethod.Invoice
              break
            default:
              throwUncoveredError(workspacePlan)
          }
          return { ...workspacePlan, paymentMethod }
        },
        subscription: async (parent) => {
          const workspaceId = parent.id
          const subscription = await getWorkspaceSubscriptionFactory({ db })({
            workspaceId
          })
          if (!subscription) return subscription
          const seats = calculateSubscriptionSeats({
            subscriptionData: subscription.subscriptionData,
            guestSeatProductId: getWorkspacePlanProductId({ workspacePlan: 'guest' })
          })
          return { ...subscription, seats }
        },
        customerPortalUrl: async (parent) => {
          const workspaceId = parent.id
          const workspaceSubscription = await getWorkspaceSubscriptionFactory({ db })({
            workspaceId
          })
          if (!workspaceSubscription) return null
          const workspace = await getWorkspaceFactory({ db })({ workspaceId })
          if (!workspace)
            throw new LogicError(
              'This cannot be, if there is a sub, there is a workspace'
            )
          return await createCustomerPortalUrlFactory({
            stripe: getStripeClient(),
            frontendOrigin: getFrontendOrigin()
          })({
            workspaceId: workspaceSubscription.workspaceId,
            workspaceSlug: workspace.slug,
            customerId: workspaceSubscription.subscriptionData.customerId
          })
        },
        hasAccessToFeature: async (parent, args) => {
          const hasAccess = await canWorkspaceAccessFeatureFactory({
            getWorkspacePlan: getWorkspacePlanFactory({ db })
          })({
            workspaceId: parent.id,
            workspaceFeature: args.featureName
          })
          return hasAccess
        },
        readOnly: async (parent) => {
          if (!FF_BILLING_INTEGRATION_ENABLED) return false
          return await isWorkspaceReadOnlyFactory({ getWorkspacePlan })({
            workspaceId: parent.id
          })
        }
      },
      ServerWorkspacesInfo: {
        planPrices: async () => {
          const getWorkspacePlanPrices = getWorkspacePlanProductPricesFactory({
            getRecurringPrices: getRecurringPricesFactory({
              stripe: getStripeClient()
            }),
            getWorkspacePlanProductAndPriceIds
          })
          const prices = await getWorkspacePlanPrices.fresh()
          return Object.entries(prices).map(([plan, price]) => ({
            id: plan,
            monthly: price.monthly,
            yearly: 'yearly' in price ? price.yearly : null
          }))
        }
      },
      WorkspaceMutations: {
        billing: () => ({})
      },
      WorkspaceBillingMutations: {
        cancelCheckoutSession: async (_parent, args, ctx) => {
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
        createCheckoutSession: async (_parent, args, ctx) => {
          let logger = extendLoggerComponent(
            ctx.log,
            'gatekeeper',
            'resolvers',
            'createCheckoutSession'
          ).child(OperationName('createCheckoutSession'))
          const { workspaceId, workspacePlan, billingInterval, isCreateFlow } =
            args.input
          logger = logger.child({ workspaceId, workspacePlan })
          const workspace = await getWorkspaceFactory({ db })({ workspaceId })

          if (!workspace) throw new WorkspaceNotFoundError()

          await authorizeResolver(
            ctx.userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )
          const createCheckoutSession = (await shouldUseNewCheckoutFlow(workspaceId))
            ? createCheckoutSessionFactoryNew({
                stripe: getStripeClient(),
                frontendOrigin: getFrontendOrigin(),
                getWorkspacePlanPrice: getWorkspacePlanPriceId
              })
            : createCheckoutSessionFactoryOld({
                stripe: getStripeClient(),
                frontendOrigin: getFrontendOrigin(),
                getWorkspacePlanPrice: getWorkspacePlanPriceId
              })
          const countRole = countWorkspaceRoleWithOptionalProjectRoleFactory({ db })
          const startCheckoutSession = (await shouldUseNewCheckoutFlow(workspaceId))
            ? startCheckoutSessionFactoryNew({
                getWorkspaceCheckoutSession: getWorkspaceCheckoutSessionFactory({ db }),
                getWorkspacePlan: getWorkspacePlanFactory({ db }),
                countSeatsByTypeInWorkspace: countSeatsByTypeInWorkspaceFactory({ db }),
                createCheckoutSession: createCheckoutSession as CreateCheckoutSession,
                saveCheckoutSession: saveCheckoutSessionFactory({ db }),
                deleteCheckoutSession: deleteCheckoutSessionFactory({ db })
              })
            : startCheckoutSessionFactoryOld({
                getWorkspaceCheckoutSession: getWorkspaceCheckoutSessionFactory({ db }),
                getWorkspacePlan: getWorkspacePlanFactory({ db }),
                countRole,
                createCheckoutSession:
                  createCheckoutSession as CreateCheckoutSessionOld,
                saveCheckoutSession: saveCheckoutSessionFactory({ db }),
                deleteCheckoutSession: deleteCheckoutSessionFactory({ db })
              })

          try {
            logger.info(OperationStatus.start, '[{operationName} ({operationStatus})]')
            const session = await startCheckoutSession({
              workspacePlan,
              workspaceId,
              workspaceSlug: workspace.slug,
              isCreateFlow: isCreateFlow || false,
              billingInterval
            })
            logger.info(
              { ...OperationStatus.success, sessionId: session.id },
              '[{operationName} ({operationStatus})]'
            )
            return session
          } catch (err) {
            const e = ensureError(err, 'Unknown error creating checkout session')
            logWithErr(
              logger,
              e,
              { ...OperationStatus.failure },
              '[{operationName} ({operationStatus})]'
            )
            throw e
          }
        },
        upgradePlan: async (_parent, args, ctx) => {
          const { workspaceId, workspacePlan, billingInterval } = args.input
          if (isNewPlanType(workspacePlan)) {
            throw new NotImplementedError()
          }

          await authorizeResolver(
            ctx.userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )
          const stripe = getStripeClient()

          const countWorkspaceRole = countWorkspaceRoleWithOptionalProjectRoleFactory({
            db
          })
          await upgradeWorkspaceSubscriptionFactory({
            getWorkspacePlan: getWorkspacePlanFactory({ db }),
            reconcileSubscriptionData: reconcileWorkspaceSubscriptionFactory({
              stripe
            }),
            countWorkspaceRole,
            getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
            getWorkspacePlanPriceId,
            getWorkspacePlanProductId,
            upsertWorkspacePlan: upsertPaidWorkspacePlanFactory({ db }),
            updateWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({ db })
          })({ workspaceId, targetPlan: workspacePlan, billingInterval })
          return true
        }
      }
    } as Resolvers)
  : {}

import { getFeatureFlags, getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { authorizeResolver } from '@/modules/shared'
import { Roles, throwUncoveredError } from '@speckle/shared'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getWorkspaceFactory,
  getWorkspaceRoleForUserFactory,
  getWorkspacesProjectsCountsFactory
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
import { isWorkspaceReadOnlyFactory } from '@/modules/gatekeeper/services/readOnly'
import {
  CreateCheckoutSession,
  WorkspaceSeatType
} from '@/modules/gatekeeper/domain/billing'
import { WorkspacePaymentMethod } from '@/test/graphql/generated/graphql'
import { LogicError } from '@/modules/shared/errors'
import { isNewPlanType } from '@/modules/gatekeeper/helpers/plans'
import { getWorkspacePlanProductPricesFactory } from '@/modules/gatekeeper/services/prices'
import { extendLoggerComponent } from '@/observability/logging'
import { createCheckoutSessionFactory } from '@/modules/gatekeeper/clients/checkout/createCheckoutSession'
import { startCheckoutSessionFactory } from '@/modules/gatekeeper/services/checkout/startCheckoutSession'
import {
  upgradeWorkspaceSubscriptionFactoryNew,
  upgradeWorkspaceSubscriptionFactoryOld
} from '@/modules/gatekeeper/services/subscriptions/upgradeWorkspaceSubscription'
import {
  countSeatsByTypeInWorkspaceFactory,
  createWorkspaceSeatFactory
} from '@/modules/gatekeeper/repositories/workspaceSeat'
import { assignWorkspaceSeatFactory } from '@/modules/workspaces/services/workspaceSeat'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getTotalSeatsCountByPlanFactory } from '@/modules/gatekeeper/services/subscriptions'
import { queryAllWorkspaceProjectsFactory } from '@/modules/workspaces/services/projects'
import { legacyGetStreamsFactory } from '@/modules/core/repositories/streams'
import { getWorkspaceModelCountFactory } from '@/modules/workspaces/services/workspaceLimits'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { getPaginatedProjectModelsTotalCountFactory } from '@/modules/core/repositories/branches'
import { withOperationLogging } from '@/observability/domain/businessLogging'

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
            case 'teamUnlimited':
            case 'pro':
            case 'proUnlimited':
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
            case 'proUnlimitedInvoiced':
            case 'teamUnlimitedInvoiced':
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
          return subscription
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
        },
        planPrices: async (parent) => {
          const getWorkspacePlanPrices = getWorkspacePlanProductPricesFactory({
            getRecurringPrices: getRecurringPricesFactory({
              stripe: getStripeClient()
            }),
            getWorkspacePlanProductAndPriceIds
          })
          const prices = await getWorkspacePlanPrices()
          const workspaceSubscription = await getWorkspaceSubscriptionFactory({ db })({
            workspaceId: parent.id
          })
          return prices[workspaceSubscription?.currency ?? 'usd']
        },
        seatType: async (parent, _args, context) => {
          if (!context.userId) return null

          const seat = await context.loaders.gatekeeper!.getUserWorkspaceSeat.load({
            workspaceId: parent.id,
            userId: context.userId
          })

          // Defaults to Editor for old plans that don't have seat types
          return seat?.type || WorkspaceSeatType.Editor
        },
        seats: async (parent) => {
          return { workspaceId: parent.id }
        }
      },
      WorkspacePlan: {
        usage: async (parent) => {
          return { workspaceId: parent.workspaceId }
        }
      },
      WorkspacePlanUsage: {
        projectCount: async (parent) => {
          const { workspaceId } = parent
          const countsByWorkspaceId = await getWorkspacesProjectsCountsFactory({ db })({
            workspaceIds: [workspaceId]
          })
          return countsByWorkspaceId[workspaceId] ?? 0
        },
        modelCount: async (parent) => {
          const { workspaceId } = parent

          return await getWorkspaceModelCountFactory({
            queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({
              getStreams: legacyGetStreamsFactory({ db })
            }),
            getPaginatedProjectModelsTotalCount: async (projectId, params) => {
              const regionDb = await getProjectDbClient({ projectId })
              return await getPaginatedProjectModelsTotalCountFactory({ db: regionDb })(
                projectId,
                params
              )
            }
          })({ workspaceId })
        }
      },
      WorkspaceSubscription: {
        seats: async (parent) => {
          return parent
        }
      },
      WorkspaceSubscriptionSeats: {
        editors: async (parent) => {
          const { workspaceId } = parent

          const [workspacePlan, subscription] = await Promise.all([
            getWorkspacePlanFactory({ db })({
              workspaceId
            }),
            getWorkspaceSubscriptionFactory({ db })({
              workspaceId
            })
          ])

          if (!workspacePlan) {
            return {
              assigned: 0,
              available: 0
            }
          }

          const assigned = await countSeatsByTypeInWorkspaceFactory({ db })({
            workspaceId,
            type: 'editor'
          })
          let available = 0

          // If we have a stripe sub, use that to resolve available
          if (subscription) {
            let purchased = 0
            switch (workspacePlan.name) {
              case 'unlimited':
              case 'academia':
              case 'business':
              case 'businessInvoiced':
              case 'free':
              case 'plus':
              case 'plusInvoiced':
              case 'starter':
              case 'starterInvoiced':
              case 'proUnlimitedInvoiced':
              case 'teamUnlimitedInvoiced':
                // not stripe paid plans and old plans do not have seats available
                break
              case 'team':
              case 'teamUnlimited':
              case 'pro':
              case 'proUnlimited':
                purchased = getTotalSeatsCountByPlanFactory({
                  getWorkspacePlanProductId
                })({
                  workspacePlan: workspacePlan.name,
                  subscriptionData: subscription.subscriptionData
                })
                break
              default:
                throwUncoveredError(workspacePlan)
            }

            available = purchased - assigned > 0 ? purchased - assigned : 0
          }

          return {
            assigned,
            available
          }
        },

        viewers: async ({ workspaceId }) => {
          return {
            assigned: await countSeatsByTypeInWorkspaceFactory({ db })({
              workspaceId,
              type: 'viewer'
            }),
            available: 0
          }
        }
      },
      WorkspaceCollaborator: {
        seatType: async (parent, _args, context) => {
          const seat = await context.loaders.gatekeeper!.getUserWorkspaceSeat.load({
            workspaceId: parent.workspaceId,
            userId: parent.id
          })

          // Defaults to Editor for old plans that don't have seat types
          return seat?.type || WorkspaceSeatType.Editor
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
          const prices = await getWorkspacePlanPrices()
          return prices
        }
      },
      ProjectCollaborator: {
        seatType: async (parent, _args, context) => {
          const seat = await context.loaders.gatekeeper!.getUserProjectSeat.load({
            projectId: parent.projectId,
            userId: parent.id
          })

          // Defaults to Editor for old plans that don't have seat types
          return seat?.type || WorkspaceSeatType.Editor
        }
      },
      WorkspaceMutations: {
        billing: () => ({}),
        updateSeatType: async (_parent, args, ctx) => {
          const { workspaceId, userId, seatType } = args.input

          await authorizeResolver(
            ctx.userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )

          const assignSeat = assignWorkspaceSeatFactory({
            createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
            getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db }),
            eventEmit: getEventBus().emit
          })
          await withOperationLogging(
            async () =>
              await assignSeat({
                workspaceId,
                userId,
                type: seatType,
                assignedByUserId: ctx.userId!
              }),
            {
              logger: ctx.log,
              operationName: 'updateWorkspaceSeatType',
              operationDescription: 'Updating seat type'
            }
          )

          return ctx.loaders.workspaces!.getWorkspace.load(workspaceId)
        }
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
          await withOperationLogging(
            async () =>
              await deleteCheckoutSessionFactory({ db })({
                checkoutSessionId: sessionId
              }),
            {
              logger: ctx.log,
              operationName: 'cancelCheckoutSession',
              operationDescription:
                'Checkout session cancelled; so checkout session is being deleted'
            }
          )
          return true
        },
        createCheckoutSession: async (_parent, args, ctx) => {
          let logger = extendLoggerComponent(ctx.log, 'gatekeeper', 'resolvers')
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
          const isNewFlow = await shouldUseNewCheckoutFlow(workspaceId)
          if (!isNewFlow)
            throw new Error('Checkout for old plans is not supported any more')
          const createCheckoutSession = createCheckoutSessionFactory({
            stripe: getStripeClient(),
            frontendOrigin: getFrontendOrigin(),
            getWorkspacePlanPrice: getWorkspacePlanPriceId
          })
          const startCheckoutSession = startCheckoutSessionFactory({
            getWorkspaceCheckoutSession: getWorkspaceCheckoutSessionFactory({ db }),
            getWorkspacePlan: getWorkspacePlanFactory({ db }),
            countSeatsByTypeInWorkspace: countSeatsByTypeInWorkspaceFactory({ db }),
            createCheckoutSession: createCheckoutSession as CreateCheckoutSession,
            saveCheckoutSession: saveCheckoutSessionFactory({ db }),
            deleteCheckoutSession: deleteCheckoutSessionFactory({ db })
          })

          return await withOperationLogging(
            async () =>
              await startCheckoutSession({
                workspacePlan,
                workspaceId,
                workspaceSlug: workspace.slug,
                isCreateFlow: isCreateFlow || false,
                billingInterval,
                currency: args.input.currency ?? 'usd'
              }),
            {
              logger,
              operationName: 'startCheckoutSession',
              operationDescription: 'Starting checkout session'
            }
          )
        },
        upgradePlan: async (_parent, args, ctx) => {
          let logger = extendLoggerComponent(ctx.log, 'gatekeeper', 'resolvers')
          const { workspaceId, workspacePlan, billingInterval } = args.input
          logger = logger.child({ workspaceId, workspacePlan })

          await authorizeResolver(
            ctx.userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )
          const stripe = getStripeClient()

          const currentPlan = await getWorkspacePlan({ workspaceId })
          const upgradeWorkspaceSubscription =
            currentPlan && isNewPlanType(currentPlan.name)
              ? upgradeWorkspaceSubscriptionFactoryNew({
                  getWorkspacePlan: getWorkspacePlanFactory({ db }),
                  reconcileSubscriptionData: reconcileWorkspaceSubscriptionFactory({
                    stripe
                  }),
                  countSeatsByTypeInWorkspace: countSeatsByTypeInWorkspaceFactory({
                    db
                  }),
                  getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
                  getWorkspacePlanPriceId,
                  getWorkspacePlanProductId,
                  upsertWorkspacePlan: upsertPaidWorkspacePlanFactory({ db }),
                  updateWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({
                    db
                  })
                })
              : upgradeWorkspaceSubscriptionFactoryOld({
                  getWorkspacePlan: getWorkspacePlanFactory({ db }),
                  reconcileSubscriptionData: reconcileWorkspaceSubscriptionFactory({
                    stripe
                  }),
                  countWorkspaceRole: countWorkspaceRoleWithOptionalProjectRoleFactory({
                    db
                  }),
                  getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
                  getWorkspacePlanPriceId,
                  getWorkspacePlanProductId,
                  upsertWorkspacePlan: upsertPaidWorkspacePlanFactory({ db }),
                  updateWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({
                    db
                  })
                })
          await withOperationLogging(
            async () =>
              await upgradeWorkspaceSubscription({
                workspaceId,
                targetPlan: workspacePlan, // This should not be casted and the cast will be removed once we will not support old plans anymore
                billingInterval
              }),
            {
              logger,
              operationName: 'upgradeWorkspaceSubscription',
              operationDescription: 'Upgrading workspace subscription'
            }
          )

          return true
        }
      }
    } as Resolvers)
  : {}

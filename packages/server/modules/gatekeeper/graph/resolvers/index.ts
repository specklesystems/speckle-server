import { getFeatureFlags, getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { authorizeResolver } from '@/modules/shared'
import {
  Roles,
  throwUncoveredError,
  WorkspaceFeatureFlags,
  WorkspacePlanFeatures,
  WorkspacePlans
} from '@speckle/shared'
import {
  getWorkspaceFactory,
  getWorkspaceRoleForUserFactory,
  getWorkspacesProjectsCountsFactory
} from '@/modules/workspaces/repositories/workspaces'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { db } from '@/db/knex'
import {
  createCustomerPortalUrlFactory,
  getRecurringPricesFactory,
  getStripeClient,
  getStripeSubscriptionDataFactory,
  reconcileWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/clients/stripe'
import {
  getWorkspacePlanPriceId,
  getWorkspacePlanProductId,
  getWorkspacePlanProductAndPriceIds
} from '@/modules/gatekeeper/helpers/prices'
import {
  deleteCheckoutSessionFactory,
  getWorkspaceCheckoutSessionFactory,
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory,
  saveCheckoutSessionFactory,
  upsertWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/repositories/billing'
import { canWorkspaceAccessFeatureFactory } from '@/modules/gatekeeper/services/featureAuthorization'
import { isWorkspaceReadOnlyFactory } from '@/modules/gatekeeper/services/readOnly'
import type { CreateCheckoutSession } from '@/modules/gatekeeper/domain/billing'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import { WorkspacePaymentMethod } from '@/modules/core/graph/generated/graphql'
import { LogicError, UnauthorizedError } from '@/modules/shared/errors'
import { getWorkspacePlanProductPricesFactory } from '@/modules/gatekeeper/services/prices'
import { extendLoggerComponent } from '@/observability/logging'
import { createCheckoutSessionFactory } from '@/modules/gatekeeper/clients/checkout/createCheckoutSession'
import { startCheckoutSessionFactory } from '@/modules/gatekeeper/services/checkout/startCheckoutSession'
import { upgradeWorkspaceSubscriptionFactory } from '@/modules/gatekeeper/services/subscriptions/upgradeWorkspaceSubscription'
import {
  countSeatsByTypeInWorkspaceFactory,
  createWorkspaceSeatFactory,
  getWorkspaceUserSeatFactory
} from '@/modules/gatekeeper/repositories/workspaceSeat'
import { assignWorkspaceSeatFactory } from '@/modules/workspaces/services/workspaceSeat'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getTotalSeatsCountByPlanFactory } from '@/modules/gatekeeper/services/subscriptions'
import { getExplicitProjects } from '@/modules/core/repositories/streams'
import { getWorkspaceModelCountFactory } from '@/modules/workspaces/services/workspaceLimits'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { getPaginatedProjectModelsTotalCountFactory } from '@/modules/core/repositories/branches'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { queryAllProjectsFactory } from '@/modules/core/services/projects'

const { FF_GATEKEEPER_MODULE_ENABLED, FF_BILLING_INTEGRATION_ENABLED } =
  getFeatureFlags()

const getWorkspacePlan = getWorkspacePlanFactory({ db })

export default FF_GATEKEEPER_MODULE_ENABLED
  ? ({
      Workspace: {
        plan: async (parent) => {
          const workspacePlan = await getWorkspacePlanFactory({ db })({
            workspaceId: parent.id
          })
          if (!workspacePlan) return null
          let paymentMethod: WorkspacePaymentMethod
          switch (workspacePlan.name) {
            case WorkspacePlans.Team:
            case WorkspacePlans.TeamUnlimited:
            case WorkspacePlans.Pro:
            case WorkspacePlans.ProUnlimited:
              paymentMethod = WorkspacePaymentMethod.Billing
              break
            case WorkspacePlans.Unlimited:
            case WorkspacePlans.Academia:
            case WorkspacePlans.Free:
              paymentMethod = WorkspacePaymentMethod.Unpaid
              break
            case WorkspacePlans.ProUnlimitedInvoiced:
            case WorkspacePlans.TeamUnlimitedInvoiced:
            case WorkspacePlans.Enterprise:
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
            getStripeClient,
            frontendOrigin: getFrontendOrigin()
          })({
            workspaceId: workspaceSubscription.workspaceId,
            workspaceSlug: workspace.slug,
            customerId: workspaceSubscription.subscriptionData.customerId
          })
        },
        hasAccessToFeature: async (parent, args) => {
          const workspaceFeature = (() => {
            switch (args.featureName) {
              case 'dashboards':
                return WorkspaceFeatureFlags.dashboards
              case 'accIntegration':
                return WorkspaceFeatureFlags.accIntegration
              case WorkspacePlanFeatures.DomainSecurity:
              case WorkspacePlanFeatures.ExclusiveMembership:
              case WorkspacePlanFeatures.HideSpeckleBranding:
              case WorkspacePlanFeatures.SSO:
              case WorkspacePlanFeatures.CustomDataRegion:
              case WorkspacePlanFeatures.SavedViews:
                return args.featureName
              default:
                throwUncoveredError(args.featureName)
            }
          })()
          const hasAccess = await canWorkspaceAccessFeatureFactory({
            getWorkspacePlan: getWorkspacePlanFactory({ db })
          })({
            workspaceId: parent.id,
            workspaceFeature
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
              getStripeClient
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

          return seat?.type || WorkspaceSeatType.Viewer
        },
        seats: async (parent) => {
          return { workspaceId: parent.id }
        }
      },
      Project: {
        hasAccessToFeature: async (parent, args) => {
          if (!parent.workspaceId) {
            return false
          }

          switch (args.featureName) {
            case WorkspacePlanFeatures.HideSpeckleBranding: {
              return await canWorkspaceAccessFeatureFactory({
                getWorkspacePlan: getWorkspacePlanFactory({ db })
              })({
                workspaceId: parent.workspaceId,
                workspaceFeature: args.featureName
              })
            }
            default: {
              // Only publicly validate embed-related features at the project level
              return false
            }
          }
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
            queryAllProjects: queryAllProjectsFactory({
              getExplicitProjects: getExplicitProjects({ db })
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
            type: WorkspaceSeatType.Editor
          })
          let available = 0

          // If we have a stripe sub, use that to resolve available
          if (subscription) {
            let purchased = 0
            switch (workspacePlan.name) {
              case WorkspacePlans.Unlimited:
              case WorkspacePlans.Academia:
              case WorkspacePlans.Free:
              case WorkspacePlans.ProUnlimitedInvoiced:
              case WorkspacePlans.TeamUnlimitedInvoiced:
              case WorkspacePlans.Enterprise:
                // not stripe paid plans and old plans do not have seats available
                break
              case WorkspacePlans.Team:
              case WorkspacePlans.TeamUnlimited:
              case WorkspacePlans.Pro:
              case WorkspacePlans.ProUnlimited:
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
              type: WorkspaceSeatType.Viewer
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

          return seat?.type || WorkspaceSeatType.Viewer
        }
      },
      ServerWorkspacesInfo: {
        planPrices: async () => {
          const getWorkspacePlanPrices = getWorkspacePlanProductPricesFactory({
            getRecurringPrices: getRecurringPricesFactory({
              getStripeClient
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
            getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db }),
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
          const userId = ctx.userId
          if (!userId) throw new UnauthorizedError()

          const workspace = await getWorkspaceFactory({ db })({ workspaceId })

          if (!workspace) throw new WorkspaceNotFoundError()

          await authorizeResolver(
            userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )

          const createCheckoutSession = createCheckoutSessionFactory({
            getStripeClient,
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
                userId,
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

          const userId = ctx.userId
          if (!userId) throw new UnauthorizedError()
          await authorizeResolver(
            userId,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )

          const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
            getWorkspacePlan: getWorkspacePlanFactory({ db }),
            reconcileSubscriptionData: reconcileWorkspaceSubscriptionFactory({
              getStripeClient,
              getStripeSubscriptionData: getStripeSubscriptionDataFactory({
                getStripeClient
              })
            }),
            countSeatsByTypeInWorkspace: countSeatsByTypeInWorkspaceFactory({
              db
            }),
            getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
            getWorkspacePlanPriceId,
            getWorkspacePlanProductId,
            updateWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({
              db
            })
          })
          await withOperationLogging(
            async () =>
              await upgradeWorkspaceSubscription({
                userId,
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

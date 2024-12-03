import { WorkspacePlans, BillingInterval } from '~/lib/common/generated/gql/graphql'
import { Roles } from '@speckle/shared'
import { PlanFeaturesList, type PricingPlan } from '@/lib/billing/helpers/types'

const baseFeatures = [
  PlanFeaturesList.Workspaces,
  PlanFeaturesList.RoleManagement,
  PlanFeaturesList.GuestUsers,
  PlanFeaturesList.PrivateAutomateFunctions,
  PlanFeaturesList.DomainSecurity
]

export const pricingPlansConfig: {
  features: Record<
    PlanFeaturesList,
    { name: string; description: (price: number) => string }
  >
  plans: Record<
    WorkspacePlans.Starter | WorkspacePlans.Plus | WorkspacePlans.Business,
    PricingPlan
  >
} = {
  features: {
    [PlanFeaturesList.Workspaces]: {
      name: PlanFeaturesList.Workspaces,
      description: (price: number) =>
        `A shared space for your team and projects £${price}/month`
    },
    [PlanFeaturesList.RoleManagement]: {
      name: PlanFeaturesList.RoleManagement,
      description: (price: number) =>
        `Control individual members' access and edit rights £${price}/month`
    },
    [PlanFeaturesList.GuestUsers]: {
      name: PlanFeaturesList.GuestUsers,
      description: (price: number) =>
        `Give guests access to specific projects £${price}/month/guest`
    },
    [PlanFeaturesList.PrivateAutomateFunctions]: {
      name: PlanFeaturesList.PrivateAutomateFunctions,
      description: (price: number) =>
        `Create and manage private automation functions securely within your workspace £${price}/month`
    },
    [PlanFeaturesList.DomainSecurity]: {
      name: PlanFeaturesList.DomainSecurity,
      description: (price: number) =>
        `Require workspace members to use a verified company email £${price}/month`
    },
    [PlanFeaturesList.SSO]: {
      name: PlanFeaturesList.SSO,
      description: (price: number) =>
        `Require workspace members to log in with your SSO provider £${price}/month`
    },
    [PlanFeaturesList.CustomDataRegion]: {
      name: PlanFeaturesList.CustomDataRegion,
      description: (price: number) =>
        `Store the workspace data in a custom region of choice £${price}/month`
    },
    [PlanFeaturesList.PrioritySupport]: {
      name: PlanFeaturesList.PrioritySupport,
      description: (price: number) => `Personal and fast support £${price}/month`
    }
  },
  plans: {
    [WorkspacePlans.Starter]: {
      name: WorkspacePlans.Starter,
      features: [...baseFeatures],
      cost: {
        [BillingInterval.Monthly]: {
          [Roles.Workspace.Guest]: 15,
          [Roles.Workspace.Member]: 15,
          [Roles.Workspace.Admin]: 15
        },
        [BillingInterval.Yearly]: {
          [Roles.Workspace.Guest]: 12,
          [Roles.Workspace.Member]: 12,
          [Roles.Workspace.Admin]: 12
        }
      }
    },
    [WorkspacePlans.Plus]: {
      name: WorkspacePlans.Plus,
      features: [...baseFeatures, PlanFeaturesList.SSO],
      cost: {
        [BillingInterval.Monthly]: {
          [Roles.Workspace.Guest]: 15,
          [Roles.Workspace.Member]: 50,
          [Roles.Workspace.Admin]: 50
        },
        [BillingInterval.Yearly]: {
          [Roles.Workspace.Guest]: 12,
          [Roles.Workspace.Member]: 40,
          [Roles.Workspace.Admin]: 40
        }
      }
    },
    [WorkspacePlans.Business]: {
      name: WorkspacePlans.Business,
      features: [
        ...baseFeatures,
        PlanFeaturesList.SSO,
        PlanFeaturesList.CustomDataRegion,
        PlanFeaturesList.PrioritySupport
      ],
      cost: {
        [BillingInterval.Monthly]: {
          [Roles.Workspace.Guest]: 15,
          [Roles.Workspace.Member]: 75,
          [Roles.Workspace.Admin]: 75
        },
        [BillingInterval.Yearly]: {
          [Roles.Workspace.Guest]: 12,
          [Roles.Workspace.Member]: 60,
          [Roles.Workspace.Admin]: 60
        }
      }
    }
  }
}

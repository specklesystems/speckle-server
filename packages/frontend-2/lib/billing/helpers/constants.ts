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
  features: Record<PlanFeaturesList, { name: string; description: string }>
  plans: Record<
    WorkspacePlans.Starter | WorkspacePlans.Plus | WorkspacePlans.Business,
    PricingPlan
  >
} = {
  features: {
    [PlanFeaturesList.Workspaces]: {
      name: PlanFeaturesList.Workspaces,
      description: 'A shared space for your team and projects'
    },
    [PlanFeaturesList.RoleManagement]: {
      name: PlanFeaturesList.RoleManagement,
      description: "Control individual members' access and edit rights"
    },
    [PlanFeaturesList.GuestUsers]: {
      name: PlanFeaturesList.GuestUsers,
      description: 'Give guests access to specific projects from £15/month/guest'
    },
    [PlanFeaturesList.PrivateAutomateFunctions]: {
      name: PlanFeaturesList.PrivateAutomateFunctions,
      description:
        'Create and manage private automation functions securely within your workspace'
    },
    [PlanFeaturesList.DomainSecurity]: {
      name: PlanFeaturesList.DomainSecurity,
      description: 'Require workspace members to use a verified company email'
    },
    [PlanFeaturesList.SSO]: {
      name: PlanFeaturesList.SSO,
      description: 'Require workspace members to log in with your SSO provider'
    },
    [PlanFeaturesList.CustomDataRegion]: {
      name: PlanFeaturesList.CustomDataRegion,
      description: "Store the workspace's data in a custom region of choice"
    },
    [PlanFeaturesList.PrioritySupport]: {
      name: PlanFeaturesList.PrioritySupport,
      description: 'Personal and fast support'
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
          [Roles.Workspace.Guest]: 50,
          [Roles.Workspace.Member]: 50,
          [Roles.Workspace.Admin]: 50
        },
        [BillingInterval.Yearly]: {
          [Roles.Workspace.Guest]: 40,
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
          [Roles.Workspace.Guest]: 75,
          [Roles.Workspace.Member]: 75,
          [Roles.Workspace.Admin]: 75
        },
        [BillingInterval.Yearly]: {
          [Roles.Workspace.Guest]: 60,
          [Roles.Workspace.Member]: 60,
          [Roles.Workspace.Admin]: 60
        }
      }
    }
  }
}

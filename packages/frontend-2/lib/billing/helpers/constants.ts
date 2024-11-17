import { WorkspacePlans, BillingInterval } from '~/lib/common/generated/gql/graphql'
import type { SeatPrices } from '~/lib/billing/helpers/types'
import { Roles } from '@speckle/shared'

// TODO: get these from the backend when available
export const seatPricesConfig: SeatPrices = {
  [WorkspacePlans.Team]: {
    [BillingInterval.Monthly]: 12,
    [BillingInterval.Yearly]: 10
  },
  [WorkspacePlans.Pro]: {
    [BillingInterval.Monthly]: 40,
    [BillingInterval.Yearly]: 36
  },
  [WorkspacePlans.Business]: {
    [BillingInterval.Monthly]: 79,
    [BillingInterval.Yearly]: 63
  },
  [WorkspacePlans.Academia]: {
    [BillingInterval.Monthly]: 0,
    [BillingInterval.Yearly]: 0
  },
  [WorkspacePlans.Unlimited]: {
    [BillingInterval.Monthly]: 0,
    [BillingInterval.Yearly]: 0
  }
}

enum PlanFeaturesList {
  Workspaces = 'Workspaces',
  RoleManagement = 'Role management',
  GuestUsers = 'Guest users',
  PrivateAutomateFunctions = 'Private automate functions',
  DomainSecurity = 'Domain security',
  SSO = 'Single Sign-On (SSO)',
  CustomerDataRegion = 'Customer data region',
  PrioritySupport = 'Priority support'
}

const baseFeatures = [
  PlanFeaturesList.Workspaces,
  PlanFeaturesList.RoleManagement,
  PlanFeaturesList.GuestUsers,
  PlanFeaturesList.PrivateAutomateFunctions,
  PlanFeaturesList.DomainSecurity
]

export const pricingPlansConfig = {
  features: {
    [PlanFeaturesList.Workspaces]: {
      name: PlanFeaturesList.Workspaces,
      description: ''
    },
    [PlanFeaturesList.RoleManagement]: {
      name: PlanFeaturesList.RoleManagement,
      description: ''
    },
    [PlanFeaturesList.GuestUsers]: {
      name: PlanFeaturesList.GuestUsers,
      description: ''
    },
    [PlanFeaturesList.PrivateAutomateFunctions]: {
      name: PlanFeaturesList.PrivateAutomateFunctions,
      description: ''
    },
    [PlanFeaturesList.DomainSecurity]: {
      name: PlanFeaturesList.DomainSecurity,
      description: ''
    },
    [PlanFeaturesList.SSO]: {
      name: PlanFeaturesList.SSO,
      description: ''
    },
    [PlanFeaturesList.CustomerDataRegion]: {
      name: PlanFeaturesList.CustomerDataRegion,
      description: ''
    },
    [PlanFeaturesList.PrioritySupport]: {
      name: PlanFeaturesList.PrioritySupport,
      description: ''
    }
  },
  plans: {
    [WorkspacePlans.Team]: {
      name: WorkspacePlans.Team,
      features: [...baseFeatures],
      cost: {
        [BillingInterval.Monthly]: {
          [Roles.Workspace.Guest]: 12,
          [Roles.Workspace.Member]: 12,
          [Roles.Workspace.Admin]: 12
        },
        [BillingInterval.Yearly]: {
          [Roles.Workspace.Guest]: 10,
          [Roles.Workspace.Member]: 10,
          [Roles.Workspace.Admin]: 10
        }
      }
    },
    [WorkspacePlans.Pro]: {
      name: WorkspacePlans.Pro,
      features: [...baseFeatures, PlanFeaturesList.SSO],
      cost: {
        [BillingInterval.Monthly]: {
          [Roles.Workspace.Guest]: 40,
          [Roles.Workspace.Member]: 40,
          [Roles.Workspace.Admin]: 40
        },
        [BillingInterval.Yearly]: {
          [Roles.Workspace.Guest]: 36,
          [Roles.Workspace.Member]: 36,
          [Roles.Workspace.Admin]: 36
        }
      }
    },
    [WorkspacePlans.Business]: {
      name: WorkspacePlans.Business,
      features: [
        ...baseFeatures,
        PlanFeaturesList.SSO,
        PlanFeaturesList.CustomerDataRegion,
        PlanFeaturesList.PrioritySupport
      ],
      cost: {
        [BillingInterval.Monthly]: {
          [Roles.Workspace.Guest]: 79,
          [Roles.Workspace.Member]: 79,
          [Roles.Workspace.Admin]: 79
        },
        [BillingInterval.Yearly]: {
          [Roles.Workspace.Guest]: 63,
          [Roles.Workspace.Member]: 63,
          [Roles.Workspace.Admin]: 63
        }
      }
    }
  }
}

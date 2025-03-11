import { WorkspaceRoles } from '../../core/constants.js'
import {
  PaidWorkspacePlans,
  UnpaidWorkspacePlans,
  WorkspacePlanBillingIntervals,
  WorkspacePlans
} from './plans.js'

type StringTemplate<Data extends object> = (data: Data) => string

/**
 * WORKSPACE FEATURES
 */

export const WorkspacePlanFeatures = <const>{
  // Core features pretty much available to everyone
  Workspace: 'workspace',
  RoleManagement: 'roleManagement',
  GuestUsers: 'guestUsers',
  PrivateAutomateFunctions: 'privateAutomateFunctions',
  // Optional/plan specific
  DomainSecurity: 'domainBasedSecurityPolicies',
  PrioritySupport: 'prioritySupport',
  SSO: 'oidcSso',
  CustomDataRegion: 'workspaceDataRegionSpecificity'
}

export type WorkspacePlanFeatures =
  (typeof WorkspacePlanFeatures)[keyof typeof WorkspacePlanFeatures]

export const WorkspacePlanFeaturesMetadata = (<const>{
  // Old
  [WorkspacePlanFeatures.Workspace]: {
    displayName: 'Workspace',
    description: 'A shared space for your team and projects'
  },
  [WorkspacePlanFeatures.RoleManagement]: {
    displayName: 'Role management',
    description: "Control individual members' access and edit rights"
  },
  [WorkspacePlanFeatures.GuestUsers]: {
    displayName: 'Guest users',
    description: (params: { price: number | string }) =>
      `Give guests access to specific projects in the workspace at ${params.price}/month/guest`
  },
  [WorkspacePlanFeatures.PrivateAutomateFunctions]: {
    displayName: 'Private automate functions',
    description:
      'Create and manage private automation functions securely within your workspace'
  },
  [WorkspacePlanFeatures.DomainSecurity]: {
    displayName: 'Domain security',
    description: 'Require workspace members to use a verified company email'
  },
  [WorkspacePlanFeatures.SSO]: {
    displayName: 'Single Sign-On (SSO)',
    description: 'Require workspace members to log in with your SSO provider'
  },
  [WorkspacePlanFeatures.CustomDataRegion]: {
    displayName: 'Custom data residency',
    description: 'Store the workspace data in a custom region'
  },
  [WorkspacePlanFeatures.PrioritySupport]: {
    displayName: 'Priority support',
    description: 'Personal and fast support'
  }
}) satisfies Record<
  WorkspacePlanFeatures,
  {
    displayName: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    description: string | StringTemplate<any>
  }
>

/**
 * PLAN CONFIG - PRICES & FEATURES
 */

export type WorkspacePlanPriceStructure = {
  [interval in WorkspacePlanBillingIntervals]: {
    [role in WorkspaceRoles]: number
  }
}

export type WorkspacePlanConfig<Plan extends WorkspacePlans = WorkspacePlans> = {
  plan: Plan
  features: readonly WorkspacePlanFeatures[]
}

const baseFeatures = [
  WorkspacePlanFeatures.Workspace,
  WorkspacePlanFeatures.RoleManagement,
  WorkspacePlanFeatures.GuestUsers,
  WorkspacePlanFeatures.PrivateAutomateFunctions
] as const

export const WorkspacePaidPlanConfigs: {
  [plan in PaidWorkspacePlans]: WorkspacePlanConfig<plan>
} = {
  // Old
  [PaidWorkspacePlans.Starter]: {
    plan: PaidWorkspacePlans.Starter,
    features: [...baseFeatures, WorkspacePlanFeatures.DomainSecurity]
  },
  [PaidWorkspacePlans.Plus]: {
    plan: PaidWorkspacePlans.Plus,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO
    ]
  },
  [PaidWorkspacePlans.Business]: {
    plan: PaidWorkspacePlans.Business,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO,
      WorkspacePlanFeatures.CustomDataRegion,
      WorkspacePlanFeatures.PrioritySupport
    ]
  },
  [PaidWorkspacePlans.Team]: {
    plan: PaidWorkspacePlans.Team,
    features: baseFeatures
  },
  [PaidWorkspacePlans.Pro]: {
    plan: PaidWorkspacePlans.Pro,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO,
      WorkspacePlanFeatures.CustomDataRegion,
      WorkspacePlanFeatures.PrioritySupport
    ]
  }
}

export const WorkspaceUnpaidPlanConfigs: {
  [plan in UnpaidWorkspacePlans]: WorkspacePlanConfig<plan>
} = {
  // Old
  [UnpaidWorkspacePlans.Unlimited]: {
    plan: UnpaidWorkspacePlans.Unlimited,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO,
      WorkspacePlanFeatures.CustomDataRegion,
      WorkspacePlanFeatures.PrioritySupport
    ]
  },
  [UnpaidWorkspacePlans.Academia]: {
    plan: UnpaidWorkspacePlans.Academia,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO,
      WorkspacePlanFeatures.CustomDataRegion,
      WorkspacePlanFeatures.PrioritySupport
    ]
  },
  [UnpaidWorkspacePlans.StarterInvoiced]: {
    ...WorkspacePaidPlanConfigs.starter,
    plan: UnpaidWorkspacePlans.StarterInvoiced
  },
  [UnpaidWorkspacePlans.PlusInvoiced]: {
    ...WorkspacePaidPlanConfigs.plus,
    plan: UnpaidWorkspacePlans.PlusInvoiced
  },
  [UnpaidWorkspacePlans.BusinessInvoiced]: {
    ...WorkspacePaidPlanConfigs.business,
    plan: UnpaidWorkspacePlans.BusinessInvoiced
  },
  // New
  [UnpaidWorkspacePlans.Free]: {
    plan: UnpaidWorkspacePlans.Free,
    features: baseFeatures
  }
}

export const WorkspacePlanConfigs = {
  ...WorkspacePaidPlanConfigs,
  ...WorkspaceUnpaidPlanConfigs
}

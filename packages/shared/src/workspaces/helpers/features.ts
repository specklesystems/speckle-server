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
  // Core features pretty much available to everyone on old plans
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

export const WorkspacePlanFeaturesNew = <const>{
  // Core features
  UnlimtedSeats: 'unlimitedSeats',
  UnlimitedGuests: 'unlimitedGuests',
  AutomateBeta: 'automateBeta',
  DomainDiscoverability: 'domainDiscoverability',
  // Optional/plan specific
  DomainSecurity: 'domainBasedSecurityPolicies',
  SSO: 'oidcSso',
  CustomDataRegion: 'workspaceDataRegionSpecificity'
}

export type WorkspacePlanFeatures =
  (typeof WorkspacePlanFeatures)[keyof typeof WorkspacePlanFeatures]

export type WorkspacePlanFeaturesNew =
  (typeof WorkspacePlanFeaturesNew)[keyof typeof WorkspacePlanFeaturesNew]

export const WorkspacePlanFeaturesMetadata = (<const>{
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

export const WorkspacePlanFeaturesMetadataNew = (<const>{
  [WorkspacePlanFeaturesNew.UnlimtedSeats]: {
    displayName: 'Unlimited editors and viewer seats',
    description: 'Unlimited editors and viewer seat'
  },
  [WorkspacePlanFeaturesNew.UnlimitedGuests]: {
    displayName: 'Unlimited guests',
    description: 'Unlimited guests'
  },
  [WorkspacePlanFeaturesNew.DomainDiscoverability]: {
    displayName: 'Domain discoverability',
    description: 'Make your workspace discoverable by your domain'
  },
  [WorkspacePlanFeaturesNew.DomainSecurity]: {
    displayName: 'Domain security',
    description: 'Require workspace members to use a verified company email'
  },
  [WorkspacePlanFeaturesNew.SSO]: {
    displayName: 'Single Sign-On (SSO)',
    description: 'Require workspace members to log in with your SSO provider'
  },
  [WorkspacePlanFeaturesNew.CustomDataRegion]: {
    displayName: 'Custom data residency',
    description: 'Store the workspace data in a custom region'
  },
  [WorkspacePlanFeaturesNew.AutomateBeta]: {
    displayName: 'Automate beta access',
    description: 'Access to the latest automate features'
  }
}) satisfies Record<
  WorkspacePlanFeaturesNew,
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

export type WorkspacePlanFeatureUnion = WorkspacePlanFeatures | WorkspacePlanFeaturesNew

export type WorkspacePlanConfig<Plan extends WorkspacePlans = WorkspacePlans> = {
  plan: Plan
  features: readonly WorkspacePlanFeatureUnion[]
}

const baseFeatures = [
  WorkspacePlanFeatures.Workspace,
  WorkspacePlanFeatures.RoleManagement,
  WorkspacePlanFeatures.GuestUsers,
  WorkspacePlanFeatures.PrivateAutomateFunctions
] as const

const baseFeaturesNew = [
  WorkspacePlanFeaturesNew.UnlimtedSeats,
  WorkspacePlanFeaturesNew.UnlimitedGuests,
  WorkspacePlanFeaturesNew.AutomateBeta,
  WorkspacePlanFeaturesNew.DomainDiscoverability
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
    features: [...baseFeaturesNew, WorkspacePlanFeaturesNew.DomainSecurity]
  },
  [PaidWorkspacePlans.Pro]: {
    plan: PaidWorkspacePlans.Pro,
    features: [
      ...baseFeaturesNew,
      WorkspacePlanFeaturesNew.DomainSecurity,
      WorkspacePlanFeaturesNew.CustomDataRegion,
      WorkspacePlanFeaturesNew.SSO
    ]
  }
}

export const WorkspaceUnpaidPlanConfigs: {
  [plan in UnpaidWorkspacePlans]: WorkspacePlanConfig<plan>
} = {
  // Old
  [UnpaidWorkspacePlans.Unlimited]: {
    plan: UnpaidWorkspacePlans.Unlimited,
    features: []
  },
  [UnpaidWorkspacePlans.Academia]: {
    plan: UnpaidWorkspacePlans.Academia,
    features: []
  },
  [UnpaidWorkspacePlans.StarterInvoiced]: {
    plan: UnpaidWorkspacePlans.StarterInvoiced,
    features: []
  },
  [UnpaidWorkspacePlans.PlusInvoiced]: {
    plan: UnpaidWorkspacePlans.PlusInvoiced,
    features: []
  },
  [UnpaidWorkspacePlans.BusinessInvoiced]: {
    plan: UnpaidWorkspacePlans.BusinessInvoiced,
    features: []
  },
  // New
  [UnpaidWorkspacePlans.Free]: {
    plan: UnpaidWorkspacePlans.Free,
    features: baseFeaturesNew
  }
}

export const WorkspaceUnpaidPlanConfigsNew: {
  [plan in UnpaidWorkspacePlans]: WorkspacePlanConfig<plan>
} = {
  // Old
  [UnpaidWorkspacePlans.Unlimited]: {
    plan: UnpaidWorkspacePlans.Unlimited,
    features: []
  },
  [UnpaidWorkspacePlans.Academia]: {
    plan: UnpaidWorkspacePlans.Academia,
    features: []
  },
  [UnpaidWorkspacePlans.StarterInvoiced]: {
    plan: UnpaidWorkspacePlans.StarterInvoiced,
    features: []
  },
  [UnpaidWorkspacePlans.PlusInvoiced]: {
    plan: UnpaidWorkspacePlans.PlusInvoiced,
    features: []
  },
  [UnpaidWorkspacePlans.BusinessInvoiced]: {
    plan: UnpaidWorkspacePlans.BusinessInvoiced,
    features: []
  },
  // New
  [UnpaidWorkspacePlans.Free]: {
    plan: UnpaidWorkspacePlans.Free,
    features: baseFeaturesNew
  }
}

export const WorkspacePlanConfigs = {
  ...WorkspacePaidPlanConfigs,
  ...WorkspaceUnpaidPlanConfigs
}

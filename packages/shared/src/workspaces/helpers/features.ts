import { WorkspaceRoles } from '../../core/constants.js'
import { WorkspaceLimits } from './limits.js'
import {
  PaidWorkspacePlans,
  UnpaidWorkspacePlans,
  WorkspacePlanBillingIntervals,
  WorkspacePlans
} from './plans.js'

/**
 * WORKSPACE FEATURES
 */

export const WorkspacePlanFeatures = <const>{
  // Core features pretty much available to everyone
  AutomateBeta: 'automateBeta',
  DomainDiscoverability: 'domainDiscoverability',
  // Optional/plan specific
  DomainSecurity: 'domainBasedSecurityPolicies',
  SSO: 'oidcSso',
  CustomDataRegion: 'workspaceDataRegionSpecificity'
}

export type WorkspacePlanFeatures =
  (typeof WorkspacePlanFeatures)[keyof typeof WorkspacePlanFeatures]

export const WorkspacePlanFeaturesMetadata = (<const>{
  [WorkspacePlanFeatures.AutomateBeta]: {
    displayName: 'Automate beta access',
    description: 'Some automate text'
  },
  [WorkspacePlanFeatures.DomainDiscoverability]: {
    displayName: 'Domain discoverability',
    description: 'Some domain discoverability text'
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
  }
}) satisfies Record<
  WorkspacePlanFeatures,
  {
    displayName: string
    description: string
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

const unlimited: WorkspaceLimits = {
  projectCount: null,
  modelCount: null,
  versionsHistory: null
}

export type WorkspacePlanConfig<Plan extends WorkspacePlans = WorkspacePlans> = {
  plan: Plan
  features: readonly WorkspacePlanFeatures[]
  limits: WorkspaceLimits
}

const baseFeatures = [
  WorkspacePlanFeatures.AutomateBeta,
  WorkspacePlanFeatures.DomainDiscoverability
] as const

export const WorkspacePaidPlanConfigs: {
  [plan in PaidWorkspacePlans]: WorkspacePlanConfig<plan>
} = {
  // Old
  [PaidWorkspacePlans.Starter]: {
    plan: PaidWorkspacePlans.Starter,
    features: [...baseFeatures],
    limits: unlimited
  },
  [PaidWorkspacePlans.Plus]: {
    plan: PaidWorkspacePlans.Plus,
    features: [...baseFeatures, WorkspacePlanFeatures.SSO],
    limits: unlimited
  },
  [PaidWorkspacePlans.Business]: {
    plan: PaidWorkspacePlans.Business,
    features: [...baseFeatures, WorkspacePlanFeatures.SSO],
    limits: unlimited
  },
  [PaidWorkspacePlans.Team]: {
    plan: PaidWorkspacePlans.Team,
    features: [...baseFeatures],
    limits: {
      projectCount: 5,
      modelCount: 25,
      versionsHistory: { value: 30, unit: 'day' }
    }
  },
  // New
  [PaidWorkspacePlans.TeamUnlimited]: {
    plan: PaidWorkspacePlans.TeamUnlimited,
    features: [...baseFeatures],
    limits: {
      projectCount: null,
      modelCount: null,
      versionsHistory: { value: 30, unit: 'day' }
    }
  },
  [PaidWorkspacePlans.Pro]: {
    plan: PaidWorkspacePlans.Pro,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO,
      WorkspacePlanFeatures.CustomDataRegion
    ],
    limits: {
      projectCount: 10,
      modelCount: 50,
      versionsHistory: null
    }
  },
  [PaidWorkspacePlans.ProUnlimited]: {
    plan: PaidWorkspacePlans.ProUnlimited,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO,
      WorkspacePlanFeatures.CustomDataRegion
    ],
    limits: {
      projectCount: null,
      modelCount: null,
      versionsHistory: null
    }
  }
}

export const WorkspaceUnpaidPlanConfigs: {
  [plan in UnpaidWorkspacePlans]: WorkspacePlanConfig<plan>
} = {
  // Old
  [UnpaidWorkspacePlans.Unlimited]: {
    plan: UnpaidWorkspacePlans.Unlimited,
    features: [],
    limits: unlimited
  },
  [UnpaidWorkspacePlans.Academia]: {
    plan: UnpaidWorkspacePlans.Academia,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO,
      WorkspacePlanFeatures.CustomDataRegion
    ],
    limits: unlimited
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
  [UnpaidWorkspacePlans.TeamUnlimitedInvoiced]: {
    ...WorkspacePaidPlanConfigs.teamUnlimited,
    plan: UnpaidWorkspacePlans.TeamUnlimitedInvoiced
  },
  [UnpaidWorkspacePlans.ProUnlimitedInvoiced]: {
    ...WorkspacePaidPlanConfigs.proUnlimited,
    plan: UnpaidWorkspacePlans.ProUnlimitedInvoiced
  },
  [UnpaidWorkspacePlans.Free]: {
    plan: UnpaidWorkspacePlans.Free,
    features: baseFeatures,
    limits: {
      projectCount: 1,
      modelCount: 5,
      versionsHistory: { value: 7, unit: 'day' }
    }
  }
}

export const WorkspacePlanConfigs = {
  ...WorkspacePaidPlanConfigs,
  ...WorkspaceUnpaidPlanConfigs
}

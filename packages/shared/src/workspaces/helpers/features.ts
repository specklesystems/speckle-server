import { WorkspaceRoles } from '../../core/constants.js'
import { WorkspaceLimits } from './limits.js'
import {
  PaidWorkspacePlans,
  UnpaidWorkspacePlans,
  WorkspacePlanBillingIntervals,
  WorkspacePlans
} from './plans.js'
import type { MaybeNullOrUndefined } from '../../core/helpers/utilityTypes.js'

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
  CustomDataRegion: 'workspaceDataRegionSpecificity',
  HideSpeckleBranding: 'hideSpeckleBranding'
}

export type WorkspacePlanFeatures =
  (typeof WorkspacePlanFeatures)[keyof typeof WorkspacePlanFeatures]

export const WorkspacePlanFeaturesMetadata = (<const>{
  [WorkspacePlanFeatures.AutomateBeta]: {
    displayName: 'Automate beta access',
    description: 'Run custom automations on every new model version'
  },
  [WorkspacePlanFeatures.DomainDiscoverability]: {
    displayName: 'Domain discoverability',
    description:
      'Allow people to discover your workspace if they use a verified company email'
  },
  [WorkspacePlanFeatures.DomainSecurity]: {
    displayName: 'Domain protection',
    description: 'Require workspace members to use a verified company email'
  },
  [WorkspacePlanFeatures.SSO]: {
    displayName: 'Single Sign-On (SSO)',
    description: 'Require workspace members to authenticate with your SSO provider'
  },
  [WorkspacePlanFeatures.CustomDataRegion]: {
    displayName: 'Custom data residency',
    description: 'Store your data in EU, UK, North America, or Asia Pacific'
  },
  [WorkspacePlanFeatures.HideSpeckleBranding]: {
    displayName: 'Customised viewer',
    description: 'Hide the Speckle branding in embedded viewer'
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
  versionsHistory: null,
  commentHistory: null
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
  [PaidWorkspacePlans.Team]: {
    plan: PaidWorkspacePlans.Team,
    features: [...baseFeatures],
    limits: {
      projectCount: 5,
      modelCount: 25,
      versionsHistory: { value: 30, unit: 'day' },
      commentHistory: { value: 30, unit: 'day' }
    }
  },
  [PaidWorkspacePlans.TeamUnlimited]: {
    plan: PaidWorkspacePlans.TeamUnlimited,
    features: [...baseFeatures],
    limits: {
      projectCount: null,
      modelCount: null,
      versionsHistory: { value: 30, unit: 'day' },
      commentHistory: { value: 30, unit: 'day' }
    }
  },
  [PaidWorkspacePlans.Pro]: {
    plan: PaidWorkspacePlans.Pro,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO,
      WorkspacePlanFeatures.CustomDataRegion,
      WorkspacePlanFeatures.HideSpeckleBranding
    ],
    limits: {
      projectCount: 10,
      modelCount: 50,
      versionsHistory: null,
      commentHistory: null
    }
  },
  [PaidWorkspacePlans.ProUnlimited]: {
    plan: PaidWorkspacePlans.ProUnlimited,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO,
      WorkspacePlanFeatures.CustomDataRegion,
      WorkspacePlanFeatures.HideSpeckleBranding
    ],
    limits: {
      projectCount: null,
      modelCount: null,
      versionsHistory: null,
      commentHistory: null
    }
  }
}

export const WorkspaceUnpaidPlanConfigs: {
  [plan in UnpaidWorkspacePlans]: WorkspacePlanConfig<plan>
} = {
  [UnpaidWorkspacePlans.Unlimited]: {
    plan: UnpaidWorkspacePlans.Unlimited,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO,
      WorkspacePlanFeatures.CustomDataRegion,
      WorkspacePlanFeatures.HideSpeckleBranding
    ],
    limits: unlimited
  },
  [UnpaidWorkspacePlans.Academia]: {
    plan: UnpaidWorkspacePlans.Academia,
    features: [
      ...baseFeatures,
      WorkspacePlanFeatures.DomainSecurity,
      WorkspacePlanFeatures.SSO,
      WorkspacePlanFeatures.CustomDataRegion,
      WorkspacePlanFeatures.HideSpeckleBranding
    ],
    limits: unlimited
  },
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
      versionsHistory: { value: 7, unit: 'day' },
      commentHistory: { value: 7, unit: 'day' }
    }
  }
}

export const WorkspacePlanConfigs = {
  ...WorkspacePaidPlanConfigs,
  ...WorkspaceUnpaidPlanConfigs
}

/**
 * Checks if a workspace exceeds its plan limits for projects and models
 */
export const workspaceExceedsPlanLimit = (
  plan: MaybeNullOrUndefined<WorkspacePlans>,
  projectCount: MaybeNullOrUndefined<number>,
  modelCount: MaybeNullOrUndefined<number>
): boolean => {
  if (!plan) return false

  const planConfig = WorkspacePlanConfigs[plan]
  if (!planConfig) return false

  const limits = planConfig.limits
  if (!limits.projectCount || !limits.modelCount) return false
  if (!projectCount || !modelCount) return false

  return projectCount > limits.projectCount || modelCount > limits.modelCount
}

/**
 * Checks if a workspace reached its plan limits for projects and models
 */
export const workspaceReachedPlanLimit = (
  plan: MaybeNullOrUndefined<WorkspacePlans>,
  projectCount: MaybeNullOrUndefined<number>,
  modelCount: MaybeNullOrUndefined<number>
): boolean => {
  if (!plan) return false

  const planConfig = WorkspacePlanConfigs[plan]
  if (!planConfig) return false

  const limits = planConfig.limits
  if (!limits.projectCount || !limits.modelCount) return false

  return projectCount === limits.projectCount || modelCount === limits.modelCount
}

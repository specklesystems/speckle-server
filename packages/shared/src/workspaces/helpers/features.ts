import { WorkspaceRoles } from '../../core/constants.js'
import { WorkspaceLimits } from './limits.js'
import {
  PaidWorkspacePlans,
  UnpaidWorkspacePlans,
  WorkspacePlanBillingIntervals,
  WorkspacePlans
} from './plans.js'
import type { MaybeNullOrUndefined } from '../../core/helpers/utilityTypes.js'
import { FeatureFlags } from '../../environment/featureFlags.js'

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
  HideSpeckleBranding: 'hideSpeckleBranding',
  ExclusiveMembership: 'exclusiveMembership',
  EmbedPrivateProjects: 'embedPrivateProjects',
  SavedViews: 'savedViews'
}

export type WorkspacePlanFeatures =
  (typeof WorkspacePlanFeatures)[keyof typeof WorkspacePlanFeatures]

// this const will be used as a bitwise flag for a per workspace feature access controller
// IMPORTANT: always use powers of 2 as the value of the object
// read more https://www.hendrik-erz.de/post/bitwise-flags-are-beautiful-and-heres-why
// this will make its way to the pricing plan and info setup at some point
// but for now its an internal only control
export const WorkspaceFeatureFlags = <const>{
  none: 0,
  dashboards: 1,
  accIntegration: 2,
  // High numbers for internal features
  presentations: 64
}

export type WorkspaceFeatureFlags =
  (typeof WorkspaceFeatureFlags)[keyof typeof WorkspaceFeatureFlags]

export const isWorkspaceFeatureFlagOn = ({
  workspaceFeatureFlags,
  feature
}: {
  workspaceFeatureFlags: number
  feature: WorkspaceFeatureFlags
}): boolean => (workspaceFeatureFlags & feature) === feature

export type WorkspaceFeatures = WorkspacePlanFeatures | WorkspaceFeatureFlags

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
  },
  [WorkspacePlanFeatures.ExclusiveMembership]: {
    displayName: 'Exclusive workspace membership',
    description:
      'Members of exclusive workspaces cannot join or create other workspaces'
  },
  [WorkspacePlanFeatures.EmbedPrivateProjects]: {
    displayName: 'Embed private projects',
    description: 'Embed projects with visibility set to private or workspace'
  },
  [WorkspacePlanFeatures.SavedViews]: {
    displayName: 'Saved views',
    description: 'Create and share saved views of your models'
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
  WorkspacePlanFeatures.DomainDiscoverability,
  WorkspacePlanFeatures.EmbedPrivateProjects
] as const

export const WorkspacePaidPlanConfigs: (params: {
  featureFlags: Partial<FeatureFlags> | undefined
}) => {
  [plan in PaidWorkspacePlans]: WorkspacePlanConfig<plan>
} = (params) => {
  const finalBaseFeatures = [
    ...baseFeatures,
    ...(params.featureFlags?.FF_SAVED_VIEWS_ENABLED
      ? [WorkspacePlanFeatures.SavedViews]
      : [])
  ]

  return {
    [PaidWorkspacePlans.Team]: {
      plan: PaidWorkspacePlans.Team,
      features: [...finalBaseFeatures],
      limits: {
        projectCount: 5,
        modelCount: 25,
        versionsHistory: { value: 30, unit: 'day' },
        commentHistory: { value: 30, unit: 'day' }
      }
    },
    [PaidWorkspacePlans.TeamUnlimited]: {
      plan: PaidWorkspacePlans.TeamUnlimited,
      features: [...finalBaseFeatures],
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
        ...finalBaseFeatures,
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
        ...finalBaseFeatures,
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
}

export const WorkspaceUnpaidPlanConfigs: (params: {
  featureFlags: Partial<FeatureFlags> | undefined
}) => {
  [plan in UnpaidWorkspacePlans]: WorkspacePlanConfig<plan>
} = (params) => {
  const finalBaseFeatures = [
    ...baseFeatures,
    ...(params.featureFlags?.FF_SAVED_VIEWS_ENABLED
      ? [WorkspacePlanFeatures.SavedViews]
      : [])
  ]
  return {
    [UnpaidWorkspacePlans.Enterprise]: {
      plan: UnpaidWorkspacePlans.Enterprise,
      features: [
        ...finalBaseFeatures,
        WorkspacePlanFeatures.DomainSecurity,
        WorkspacePlanFeatures.SSO,
        WorkspacePlanFeatures.CustomDataRegion,
        WorkspacePlanFeatures.HideSpeckleBranding,
        WorkspacePlanFeatures.ExclusiveMembership
      ],
      limits: unlimited
    },
    [UnpaidWorkspacePlans.Unlimited]: {
      plan: UnpaidWorkspacePlans.Unlimited,
      features: [
        ...finalBaseFeatures,
        WorkspacePlanFeatures.DomainSecurity,
        WorkspacePlanFeatures.SSO,
        WorkspacePlanFeatures.CustomDataRegion,
        WorkspacePlanFeatures.HideSpeckleBranding,
        WorkspacePlanFeatures.ExclusiveMembership
      ],
      limits: unlimited
    },
    [UnpaidWorkspacePlans.Academia]: {
      plan: UnpaidWorkspacePlans.Academia,
      features: [
        ...finalBaseFeatures,
        WorkspacePlanFeatures.DomainSecurity,
        WorkspacePlanFeatures.SSO,
        WorkspacePlanFeatures.CustomDataRegion,
        WorkspacePlanFeatures.HideSpeckleBranding
      ],
      limits: unlimited
    },
    [UnpaidWorkspacePlans.TeamUnlimitedInvoiced]: {
      ...WorkspacePaidPlanConfigs(params).teamUnlimited,
      plan: UnpaidWorkspacePlans.TeamUnlimitedInvoiced
    },
    [UnpaidWorkspacePlans.ProUnlimitedInvoiced]: {
      ...WorkspacePaidPlanConfigs(params).proUnlimited,
      plan: UnpaidWorkspacePlans.ProUnlimitedInvoiced
    },
    [UnpaidWorkspacePlans.Free]: {
      plan: UnpaidWorkspacePlans.Free,
      features: finalBaseFeatures,
      limits: {
        projectCount: 1,
        modelCount: 5,
        versionsHistory: { value: 7, unit: 'day' },
        commentHistory: { value: 7, unit: 'day' }
      }
    }
  }
}

export const WorkspacePlanConfigs = (params: {
  featureFlags: Partial<FeatureFlags> | undefined
}) => ({
  ...WorkspacePaidPlanConfigs(params),
  ...WorkspaceUnpaidPlanConfigs(params)
})

/**
 * Checks if a workspace exceeds its plan limits for projects and models
 */
export const workspaceExceedsPlanLimit = (params: {
  plan: MaybeNullOrUndefined<WorkspacePlans>
  projectCount: MaybeNullOrUndefined<number>
  modelCount: MaybeNullOrUndefined<number>
  featureFlags: Partial<FeatureFlags> | undefined
}): boolean => {
  const { plan, projectCount, modelCount, featureFlags } = params
  if (!plan) return false

  const planConfig = WorkspacePlanConfigs({ featureFlags })[plan]
  if (!planConfig) return false

  const limits = planConfig.limits
  if (!limits.projectCount || !limits.modelCount) return false
  if (!projectCount || !modelCount) return false

  return projectCount > limits.projectCount || modelCount > limits.modelCount
}

/**
 * Checks if a workspace reached its plan limits for projects and models
 */
export const workspaceReachedPlanLimit = (params: {
  plan: MaybeNullOrUndefined<WorkspacePlans>
  projectCount: MaybeNullOrUndefined<number>
  modelCount: MaybeNullOrUndefined<number>
  featureFlags: Partial<FeatureFlags> | undefined
}): boolean => {
  const { plan, projectCount, modelCount, featureFlags } = params
  if (!plan) return false

  const planConfig = WorkspacePlanConfigs({ featureFlags })[plan]
  if (!planConfig) return false

  const limits = planConfig.limits
  if (!limits.projectCount || !limits.modelCount) return false

  return projectCount === limits.projectCount || modelCount === limits.modelCount
}

export const workspacePlanHasAccessToFeature = ({
  plan,
  feature,
  featureFlags
}: {
  plan: WorkspacePlans
  feature: WorkspacePlanFeatures
  featureFlags: Partial<FeatureFlags> | undefined
}): boolean => {
  const planConfig = WorkspacePlanConfigs({ featureFlags })[plan]
  const hasAccess = planConfig.features.includes(feature)
  return hasAccess
}

export const isPlanFeature = (
  feature: WorkspaceFeatures
): feature is WorkspacePlanFeatures => {
  if (typeof feature === 'number') {
    return false
  }
  return Object.values(WorkspacePlanFeatures).includes(feature)
}

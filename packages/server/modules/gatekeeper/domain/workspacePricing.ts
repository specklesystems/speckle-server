import { z } from 'zod'

export type WorkspaceFeatureName =
  | 'domainBasedSecurityPolicies'
  | 'oidcSso'
  | 'workspaceDataRegionSpecificity'

type FeatureDetails = {
  displayName: string
  description?: string
}

const features: Record<WorkspaceFeatureName, FeatureDetails> = {
  domainBasedSecurityPolicies: {
    description: 'Email domain based security policies',
    displayName: 'Domain security policies'
  },
  oidcSso: {
    displayName: 'Login / signup to the workspace with an OIDC provider'
  },
  workspaceDataRegionSpecificity: {
    displayName: 'Specify the geolocation, where the workspace project data is stored'
  }
} as const

type WorkspaceFeatures = Record<keyof typeof features, boolean>

type Limits = 'uploadSize' | 'automateMinutes'

type LimitDetails = {
  displayName: string
  measurementUnit: string | null
}

const limits: Record<Limits, LimitDetails> = {
  automateMinutes: {
    displayName: 'Automate minutes',
    measurementUnit: 'minutes'
  },
  uploadSize: {
    displayName: 'Upload size limit',
    measurementUnit: 'MB'
  }
}

export const workspacePricingPlanInformation = { features, limits }

type WorkspaceLimits = Record<keyof typeof limits, number | null>

type WorkspacePlanFeaturesAndLimits = WorkspaceFeatures & WorkspaceLimits

const baseFeatures = {
  domainBasedSecurityPolicies: true
}

export const trialWorkspacePlans = z.literal('team')

export type TrialWorkspacePlans = z.infer<typeof trialWorkspacePlans>

export const paidWorkspacePlans = z.union([
  trialWorkspacePlans,
  z.literal('pro'),
  z.literal('business')
])

export type PaidWorkspacePlans = z.infer<typeof paidWorkspacePlans>

// these are not publicly exposed for general use on billing enabled servers
export const unpaidWorkspacePlans = z.union([
  z.literal('unlimited'),
  z.literal('academia')
])

export type UnpaidWorkspacePlans = z.infer<typeof unpaidWorkspacePlans>

export const workspacePlans = z.union([paidWorkspacePlans, unpaidWorkspacePlans])

// this includes the plans your workspace can be on
export type WorkspacePlans = z.infer<typeof workspacePlans>

// this includes the pricing plans a customer can sub to
export type WorkspacePricingPlans = PaidWorkspacePlans | 'guest'

export const workspacePlanBillingIntervals = z.union([
  z.literal('monthly'),
  z.literal('yearly')
])
export type WorkspacePlanBillingIntervals = z.infer<
  typeof workspacePlanBillingIntervals
>

const team: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  oidcSso: false,
  workspaceDataRegionSpecificity: false,
  automateMinutes: 300,
  uploadSize: 500
}

const pro: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  oidcSso: true,
  workspaceDataRegionSpecificity: false,
  automateMinutes: 900,
  uploadSize: 1000
}

const business: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  oidcSso: true,
  workspaceDataRegionSpecificity: true,
  automateMinutes: 900,
  uploadSize: 1000
}

const unlimited: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  oidcSso: true,
  workspaceDataRegionSpecificity: true,
  automateMinutes: null,
  uploadSize: 1000
}

const academia: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  oidcSso: true,
  workspaceDataRegionSpecificity: false,
  automateMinutes: null,
  uploadSize: 100
}

const paidWorkspacePlanFeatures: Record<
  PaidWorkspacePlans,
  WorkspacePlanFeaturesAndLimits
> = {
  team,
  pro,
  business
}

export const unpaidWorkspacePlanFeatures: Record<
  UnpaidWorkspacePlans,
  WorkspacePlanFeaturesAndLimits
> = {
  academia,
  unlimited
}

export const workspacePlanFeatures: Record<
  WorkspacePlans,
  WorkspacePlanFeaturesAndLimits
> = { ...paidWorkspacePlanFeatures, ...unpaidWorkspacePlanFeatures }

export const pricingTable = {
  workspacePricingPlanInformation,
  workspacePlanInformation: paidWorkspacePlanFeatures
}

import { z } from 'zod'

type Features =
  | 'domainBasedSecurityPolicies'
  | 'oidcSso'
  | 'workspaceDataRegionSpecificity'

type FeatureDetails = {
  displayName: string
  description?: string
}

const features: Record<Features, FeatureDetails> = {
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

type WorkspacePricingPlan = WorkspaceFeatures & WorkspaceLimits

const baseFeatures = {
  domainBasedSecurityPolicies: true
}

export const workspacePlans = z.union([
  z.literal('team'),
  z.literal('pro'),
  z.literal('business'),
  z.literal('unlimited')
])
export type WorkspacePlans = z.infer<typeof workspacePlans>

const team: WorkspacePricingPlan = {
  ...baseFeatures,
  oidcSso: false,
  workspaceDataRegionSpecificity: false,
  automateMinutes: 300,
  uploadSize: 500
}

const pro: WorkspacePricingPlan = {
  ...baseFeatures,
  oidcSso: true,
  workspaceDataRegionSpecificity: false,
  automateMinutes: 900,
  uploadSize: 1000
}

const business: WorkspacePricingPlan = {
  ...baseFeatures,
  oidcSso: true,
  workspaceDataRegionSpecificity: true,
  automateMinutes: 900,
  uploadSize: 1000
}

const unlimited: WorkspacePricingPlan = {
  ...baseFeatures,
  oidcSso: true,
  workspaceDataRegionSpecificity: true,
  automateMinutes: null,
  uploadSize: 1000
}

const workspacePricingPlans: Record<WorkspacePlans, WorkspacePricingPlan> = {
  team,
  pro,
  business,
  unlimited
}

export const pricingTable = {
  workspacePricingPlanInformation,
  workspacePricingPlans
}

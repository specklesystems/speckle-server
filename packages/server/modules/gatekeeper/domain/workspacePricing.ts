import {
  PaidWorkspacePlans,
  UnpaidWorkspacePlans,
  WorkspacePlans
} from '@/modules/gatekeeperCore/domain/billing'
import type { MaybeNullOrUndefined } from '@speckle/shared'

export type WorkspaceFeatureName =
  | 'workspace'
  | 'domainBasedSecurityPolicies'
  | 'oidcSso'
  | 'workspaceDataRegionSpecificity'

type FeatureDetails = {
  displayName: string
  description?: string
}

const features: Record<WorkspaceFeatureName, FeatureDetails> = {
  workspace: {
    displayName: 'Workspace'
  },
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

type WorkspaceInfoDetails = {
  name: MaybeNullOrUndefined<WorkspacePlans>
  description: MaybeNullOrUndefined<string>
}

type WorkspaceInfo = Record<keyof WorkspaceInfoDetails, MaybeNullOrUndefined<string>>

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

type WorkspacePlanFeaturesAndLimits = WorkspaceInfo &
  WorkspaceFeatures &
  WorkspaceLimits

const baseFeatures = {
  domainBasedSecurityPolicies: true,
  workspace: true
}

// new
const free: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  name: 'free',
  description: 'For individuals, small teams and basic usage',
  oidcSso: false,
  workspaceDataRegionSpecificity: false,
  automateMinutes: 300,
  uploadSize: 100
}

const team: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  name: 'team',
  description: 'For small teams and advanced usage',
  oidcSso: false,
  workspaceDataRegionSpecificity: false,
  // TODO: What should be the real numbers here for the new plans (free/team/pro?
  automateMinutes: 300,
  uploadSize: 100
}

const pro: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  name: 'pro',
  description: 'For larger teams and advanced usage',
  // TODO: The following 2 will become conditional based on purchased addons
  oidcSso: true,
  workspaceDataRegionSpecificity: true,
  automateMinutes: 900,
  uploadSize: 100
}

// old
const starter: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  name: 'starter',
  description: 'The team plan',
  oidcSso: false,
  workspaceDataRegionSpecificity: false,
  automateMinutes: 300,
  uploadSize: 100
}

const plus: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  name: 'plus',
  description: 'The pro plan',
  oidcSso: true,
  workspaceDataRegionSpecificity: false,
  automateMinutes: 900,
  uploadSize: 100
}

const business: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  name: 'business',
  description: 'The business plan',
  oidcSso: true,
  workspaceDataRegionSpecificity: true,
  automateMinutes: 900,
  uploadSize: 100
}

// custom
const unlimited: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  name: 'unlimited',
  description: 'The unlimited plan',
  oidcSso: true,
  workspaceDataRegionSpecificity: true,
  automateMinutes: null,
  uploadSize: 100
}

const academia: WorkspacePlanFeaturesAndLimits = {
  ...baseFeatures,
  name: 'academia',
  description: 'The academia plan',
  oidcSso: true,
  workspaceDataRegionSpecificity: true,
  automateMinutes: 900,
  uploadSize: 100
}

const paidWorkspacePlanFeatures: Record<
  PaidWorkspacePlans,
  WorkspacePlanFeaturesAndLimits
> = {
  // old
  starter,
  plus,
  business,
  // new
  team,
  pro
}

export const unpaidWorkspacePlanFeatures: Record<
  UnpaidWorkspacePlans,
  WorkspacePlanFeaturesAndLimits
> = {
  free,
  academia,
  unlimited,
  starterInvoiced: starter,
  plusInvoiced: plus,
  businessInvoiced: business
}

export const workspacePlanFeatures: Record<
  WorkspacePlans,
  WorkspacePlanFeaturesAndLimits
> = { ...paidWorkspacePlanFeatures, ...unpaidWorkspacePlanFeatures }

export const pricingTable = {
  workspacePricingPlanInformation,
  workspacePlanInformation: paidWorkspacePlanFeatures
}

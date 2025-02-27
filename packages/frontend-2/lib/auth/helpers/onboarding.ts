import { OnboardingRole, OnboardingPlan, OnboardingSource } from '@speckle/shared'

export const RoleTitleMap: Record<OnboardingRole, string> = {
  [OnboardingRole.ComputationalDesign]: 'Computational Design',
  [OnboardingRole.BIM]: 'Building Information Modelling (BIM)',
  [OnboardingRole.ArchitecturePlanning]: 'Architecture & Planning',
  [OnboardingRole.EngineeringAEC]: 'Engineering (Structural, MEP, Civil, etc)',
  [OnboardingRole.EngineeringSoftware]: 'Engineering (Software)',
  [OnboardingRole.Education]: 'Education',
  [OnboardingRole.Management]: 'Management & Leadership',
  [OnboardingRole.Other]: 'Other'
}

export const PlanTitleMap: Record<OnboardingPlan, string> = {
  [OnboardingPlan.Exploring]: 'Just checking things out',
  [OnboardingPlan.DataExchange]: 'Exchange data between applications',
  [OnboardingPlan.Analytics]:
    'Data analytics, visualisation and reporting (eg PowerBI)',
  [OnboardingPlan.Collaboration]: 'Collaborate with my team and share 3D models online',
  [OnboardingPlan.DataWarehouse]: 'Data warehouse and common data environment (CDE)',
  [OnboardingPlan.Development]: 'Develop custom functionalities and apps',
  [OnboardingPlan.Other]: 'Other'
}

export const SourceTitleMap: Record<OnboardingSource, string> = {
  [OnboardingSource.SocialMedia]: 'Social Media',
  [OnboardingSource.Search]: 'Internet search',
  [OnboardingSource.Referral]: 'Friend or colleague',
  [OnboardingSource.Event]: 'Event or conference',
  [OnboardingSource.Education]: 'University or course',
  [OnboardingSource.Other]: 'Other'
}

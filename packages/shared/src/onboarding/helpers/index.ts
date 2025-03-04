export enum OnboardingRole {
  ComputationalDesign = 'computational-design',
  BIM = 'bim',
  ArchitecturePlanning = 'architecture-planning',
  EngineeringAEC = 'engineering-aec',
  EngineeringSoftware = 'engineering-software',
  Education = 'education',
  Management = 'management',
  Other = 'other'
}

export enum OnboardingPlan {
  Exploring = 'exploring',
  DataExchange = 'data-exchange',
  Analytics = 'analytics',
  Collaboration = 'collaboration',
  DataWarehouse = 'data-warehouse',
  Development = 'development',
  Other = 'other'
}

export enum OnboardingSource {
  SocialMedia = 'social-media',
  Search = 'internet-search',
  Referral = 'friend-or-colleague',
  Event = 'event-conference',
  Education = 'university-course',
  Other = 'other'
}

export type OnboardingState = {
  role?: OnboardingRole
  plans?: OnboardingPlan[]
  source?: OnboardingSource
}

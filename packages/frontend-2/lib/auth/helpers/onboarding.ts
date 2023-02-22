export enum OnboardingIndustry {
  Architecture = 'architecture',
  Engineering = 'engineering',
  Construction = 'construction',
  Design = 'design',
  Gaming = 'gaming',
  Other = 'other'
}

export enum OnboardingRole {
  BimManager = 'bim-manager',
  ComputationalDesigner = 'computational-designer',
  Architect = 'architect',
  Engineer = 'engineer',
  SoftwareDeveloper = 'software-developer',
  Other = 'other'
}

export const RoleTitleMap: Record<OnboardingRole, string> = {
  [OnboardingRole.Architect]: 'Architect',
  [OnboardingRole.BimManager]: 'BIM Manager',
  [OnboardingRole.Engineer]: 'Engineer',
  [OnboardingRole.SoftwareDeveloper]: 'Software Developer',
  [OnboardingRole.ComputationalDesigner]: 'Computational Designer',
  [OnboardingRole.Other]: 'Other'
}

export type OnboardingState = {
  industry?: OnboardingIndustry
  role?: OnboardingRole
}

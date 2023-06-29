export enum OnboardingIndustry {
  Architecture = 'architecture & planning',
  Engineering = 'engineering',
  Construction = 'construction',
  Software = 'software development',
  Edu = 'higher education',
  Other = 'other'
}

export enum OnboardingRole {
  ComputationalDesigner = 'computational-designer',
  SoftwareDeveloper = 'software-developer',
  DesignerOrEngineer = 'designer-or-engineer',
  Manager = 'manager',
  Student = 'student',
  Other = 'other'
}

export const RoleTitleMap: Record<OnboardingRole, string> = {
  [OnboardingRole.ComputationalDesigner]: 'Computational Designer',
  [OnboardingRole.SoftwareDeveloper]: 'Software Developer',
  [OnboardingRole.DesignerOrEngineer]: 'Designer Or Engineer',
  [OnboardingRole.Manager]: 'Manager',
  [OnboardingRole.Student]: 'Student',
  [OnboardingRole.Other]: 'Other'
}

export type OnboardingState = {
  industry?: OnboardingIndustry
  role?: OnboardingRole
}

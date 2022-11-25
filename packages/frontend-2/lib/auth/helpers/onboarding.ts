export enum OnboardingIndustry {
  Architecture = 'architecture',
  Engineering = 'engineering',
  Construction = 'construction',
  Design = 'design',
  Manufacturing = 'manufacturing',
  Gaming = 'gaming'
}

export enum OnboardingRole {
  Architect = 'architect',
  BimManager = 'bim-manager',
  StructuralEngineer = 'structural-engineer',
  MepEngineer = 'mep-engineer',
  SoftwareDeveloper = 'software-developer',
  ComputationalDesigner = 'computational-designer'
}

export const RoleTitleMap: Record<OnboardingRole, string> = {
  [OnboardingRole.Architect]: 'Architect',
  [OnboardingRole.BimManager]: 'BIM Manager',
  [OnboardingRole.StructuralEngineer]: 'Structural Engineer',
  [OnboardingRole.MepEngineer]: 'MEP Engineer',
  [OnboardingRole.SoftwareDeveloper]: 'Software Developer',
  [OnboardingRole.ComputationalDesigner]: 'Computational Designer'
}

export type OnboardingState = {
  industry?: OnboardingIndustry
  role?: OnboardingRole
}

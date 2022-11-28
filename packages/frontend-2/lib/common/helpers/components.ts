export interface StepCoreType {
  name: string
  href?: string
  onClick?: () => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BulletStepType extends StepCoreType {}

export interface NumberStepType extends BulletStepType {
  description?: string
}

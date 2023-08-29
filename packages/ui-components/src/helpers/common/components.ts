/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConcreteComponent } from 'vue'

export type PropComponentType = ConcreteComponent<any, any, any, any, any>

export type HorizontalOrVertical = 'horizontal' | 'vertical'

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

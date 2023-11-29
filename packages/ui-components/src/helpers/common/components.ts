/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ConcreteComponent, FunctionalComponent } from 'vue'

export type PropAnyComponent =
  | ConcreteComponent<any, any, any, any, any>
  | FunctionalComponent<any, any, any>

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

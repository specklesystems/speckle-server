/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ConcreteComponent, FunctionalComponent, DefineComponent } from 'vue'

export type PropAnyComponent =
  | ConcreteComponent<any, any, any, any, any>
  | FunctionalComponent<any, any, any>
  | DefineComponent
  | string

export type HorizontalOrVertical = 'horizontal' | 'vertical'

export interface StepCoreType {
  name: string
  href?: string
  onClick?: () => void
}

export interface BulletStepType extends StepCoreType {}

export interface NumberStepType extends BulletStepType {
  description?: string
}

export type AlertColor = 'success' | 'danger' | 'warning' | 'info'

export type AlertAction = {
  title: string
  url?: string
  onClick?: () => void
  externalUrl?: boolean
  disabled?: boolean
}

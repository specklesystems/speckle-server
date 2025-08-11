/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ConcreteComponent, FunctionalComponent, DefineComponent } from 'vue'

export type PropAnyComponent =
  | ConcreteComponent<any, any, any, any, any>
  | FunctionalComponent<any, any, any>
  | DefineComponent
  | string

export type HorizontalOrVertical = 'horizontal' | 'vertical'

// Lucide icon size types

export enum LucideSize {
  sm = 12,
  base = 16,
  lg = 20,
  xxl = 32
}

export interface StepCoreType {
  name: string
  href?: string
  onClick?: () => void
}

export interface BulletStepType extends StepCoreType {}

export interface NumberStepType extends BulletStepType {
  description?: string
}

export type AlertColor = 'success' | 'danger' | 'warning' | 'info' | 'neutral'

export type AlertAction = {
  title: string
  url?: string
  onClick?: () => void
  externalUrl?: boolean
  disabled?: boolean
}

export type FormRadioGroupItem<V extends string = string> = {
  value: V
  title: string
  subtitle?: string
  introduction?: string
  icon?: ConcreteComponent
  help?: string
  disabled?: boolean
}

import type { ConcreteComponent } from 'vue'
import type { FormButton } from '~~/src/lib'

type FormButtonProps = InstanceType<typeof FormButton>['$props']

export enum GridListToggleValue {
  Grid = 'grid',
  List = 'list'
}

export type LayoutTabItem<I extends string = string> = {
  title: string
  id: I
}

export type LayoutPageTabItem<I extends string = string> = {
  title: string
  id: I
  icon?: ConcreteComponent
  count?: number
  tag?: string
}

export type LayoutMenuItem<I extends string = string> = {
  icon?: ConcreteComponent
  title: string
  id: I
  disabled?: boolean
  disabledTooltip?: string
  color?: 'danger' | 'info'
}

export type LayoutDialogButton = {
  text: string
  props?: Record<string, unknown> & FormButtonProps
  onClick?: () => void
  disabled?: boolean
  submit?: boolean
}

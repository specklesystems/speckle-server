import type { ConcreteComponent } from 'vue'
import type { PropAnyComponent } from '~~/src/helpers/common/components'

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
  count?: number
  tag?: string
  icon?: PropAnyComponent
}

export type LayoutMenuItem<I extends string = string> = {
  icon?: ConcreteComponent
  title: string
  id: I
  disabled?: boolean
  disabledTooltip?: string
  color?: 'danger' | 'info'
}

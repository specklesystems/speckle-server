import type { ConcreteComponent } from 'vue'
import type { FormButton } from '~~/src/lib'

type FormButtonProps = InstanceType<typeof FormButton>['$props']
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
  disabled?: boolean
  disabledMessage?: string
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
  onClick?: (e: MouseEvent) => void
  disabled?: boolean
  submit?: boolean
  /**
   * This should uniquely identify the button within the form. Even if you have different sets
   * of buttons rendered on different steps of a wizard, all of them should have unique IDs to
   * ensure proper form functionality.
   */
  id?: string
}

export type LayoutTableColours = 'primary' | 'outline' | 'subtle' | 'danger'

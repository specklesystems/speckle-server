export enum GridListToggleValue {
  Grid = 'grid',
  List = 'list'
}

export type LayoutTabItem<I extends string = string> = {
  title: string
  id: I
}

export type LayoutMenuItem<I extends string = string> = {
  title: string
  id: I
  disabled?: boolean
  disabledTooltip?: string
}

export type MenuItem = {
  title: string
  component?: ReturnType<typeof defineComponent>
  disabled?: boolean
  tooltipText?: string
}

export type SettingsMenuItems = {
  [key: string]: MenuItem
}

import type { AvailableRoles } from '@speckle/shared'

export type SettingsMenuItem = {
  title: string
  component?: ReturnType<typeof defineComponent>
  disabled?: boolean
  tooltipText?: string
  permission?: AvailableRoles[]
}

export type SettingsMenuItems = {
  [key: string]: SettingsMenuItem
}

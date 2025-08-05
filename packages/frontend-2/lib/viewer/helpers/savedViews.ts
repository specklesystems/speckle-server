import type { StringEnumValues } from '@speckle/shared'

export const ViewsType = {
  All: 'all-views',
  My: 'my-views',
  Connector: 'connector-views'
} as const
export type ViewsType = StringEnumValues<typeof ViewsType>

export const viewsTypeLabels: Record<ViewsType, string> = {
  [ViewsType.All]: 'All Views',
  [ViewsType.My]: 'My Views',
  [ViewsType.Connector]: 'From connectors'
}

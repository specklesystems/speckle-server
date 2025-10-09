import { StringEnum, type StringEnumValues } from '@speckle/shared'
import type { ViewerResourceItem } from '~/lib/common/generated/gql/graphql'

export const ViewerRenderPageType = StringEnum(['Viewer', 'Presentation'])
export type ViewerRenderPageType = StringEnumValues<typeof ViewerRenderPageType>

export type PreloadableResource<R extends ViewerResourceItem> = {
  resource: R
  isPreloadOnly: boolean
}

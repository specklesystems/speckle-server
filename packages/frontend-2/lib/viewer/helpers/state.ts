import { StringEnum, type StringEnumValues } from '@speckle/shared'

export const ViewerRenderPageType = StringEnum(['Viewer', 'Presentation'])
export type ViewerRenderPageType = StringEnumValues<typeof ViewerRenderPageType>

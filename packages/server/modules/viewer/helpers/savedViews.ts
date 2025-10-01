import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import {
  formatResourceIdsForGroup,
  buildDefaultGroupId,
  decodeDefaultGroupId,
  type DefaultGroupMetadata
} from '@speckle/shared/saved-views'

export const thumbnailRoute =
  '/api/v1/projects/:projectId/saved-views/:viewId/thumbnail'
export const fullPreviewRoute =
  '/api/v1/projects/:projectId/saved-views/:viewId/preview'

export const getThumbnailUrl = (params: { projectId: string; viewId: string }) => {
  const route = thumbnailRoute
    .replace(':projectId', params.projectId)
    .replace(':viewId', params.viewId)
  return new URL(route, getServerOrigin()).toString()
}

export const getPreviewUrl = (params: { projectId: string; viewId: string }) => {
  const route = fullPreviewRoute
    .replace(':projectId', params.projectId)
    .replace(':viewId', params.viewId)
  return new URL(route, getServerOrigin()).toString()
}

export { formatResourceIdsForGroup, buildDefaultGroupId, decodeDefaultGroupId }
export type { DefaultGroupMetadata }

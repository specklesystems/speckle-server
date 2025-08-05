import type { ViewerUpdateTrackingTarget } from '@/modules/core/graph/generated/graphql'
import type {
  ViewerResourceGroup,
  ViewerResourceItem
} from '@/modules/viewer/domain/types/resources'

export type GetViewerResourceGroups = (
  target: ViewerUpdateTrackingTarget & { allowEmptyModels?: boolean }
) => Promise<ViewerResourceGroup[]>

export type GetViewerResourceItemsUngrouped = (
  target: ViewerUpdateTrackingTarget
) => Promise<ViewerResourceItem[]>

import type {
  SavedView,
  SavedViewGroup
} from '@/modules/viewer/domain/types/savedViews'
import type { StringEnumValues } from '@speckle/shared'

export const savedViewsEventNamespace = 'savedViews' as const

export const SavedViewsEvents = <const>{
  Created: `${savedViewsEventNamespace}.created`,
  Updated: `${savedViewsEventNamespace}.updated`,
  Deleted: `${savedViewsEventNamespace}.deleted`,
  GroupCreated: `${savedViewsEventNamespace}.groupCreated`,
  GroupUpdated: `${savedViewsEventNamespace}.groupUpdated`,
  GroupDeleted: `${savedViewsEventNamespace}.groupDeleted`
}
export type SavedViewsEvents = StringEnumValues<typeof SavedViewsEvents>

export type SavedViewsEventsPayloads = {
  [SavedViewsEvents.Created]: { savedView: SavedView; creatorId: string }
  [SavedViewsEvents.Updated]: { savedView: SavedView; updaterId: string }
  [SavedViewsEvents.Deleted]: { savedView: SavedView; deleterId: string }
  [SavedViewsEvents.GroupCreated]: { savedViewGroup: SavedViewGroup; creatorId: string }
  [SavedViewsEvents.GroupUpdated]: {
    savedViewGroup: SavedViewGroup
    updaterId: string
    /**
     * Whether update is caused indirectly by someone who might not even have access to update the group, e.g.
     * if group was used in a new saved view
     */
    isIndirectUpdate: boolean
  }
  [SavedViewsEvents.GroupDeleted]: { savedViewGroup: SavedViewGroup; deleterId: string }
}

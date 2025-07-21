import { SavedView } from '@/modules/viewer/domain/types/savedViews'
import { NullableKeysToOptional } from '@speckle/shared'

export type StoreView = (params: {
  view: NullableKeysToOptional<SavedView>
}) => Promise<SavedView>

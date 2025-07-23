import { base64Decode, base64Encode } from '@/modules/shared/helpers/cryptoHelper'
import type { SavedViewGroup } from '@/modules/viewer/domain/types/savedViews'
import type { MaybeNullOrUndefined } from '@speckle/shared'

/**
 * Reserved group name for use in cursors, because a null group name should
 * still have a valid cursor.
 * Zeroes are used to ensure this one always comes in first
 */
export const NULL_GROUP_NAME_VALUE = '000------NULL_GROUP_NAME------'

export const buildSavedViewGroupId = (
  params: Pick<SavedViewGroup, 'projectId' | 'resourceIds' | 'name'>
) => {
  const json = JSON.stringify(params)
  return base64Encode(json)
}

export const savedGroupCursorUtils = () => {
  const encode = (group: { name: string | null }) => {
    return base64Encode(group.name || NULL_GROUP_NAME_VALUE)
  }

  const decode = (cursor: MaybeNullOrUndefined<string>) => {
    if (!cursor) return null
    return base64Decode(cursor)
  }

  return {
    encode,
    decode
  }
}

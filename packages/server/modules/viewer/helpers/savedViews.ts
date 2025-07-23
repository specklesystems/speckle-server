import { base64Decode, base64Encode } from '@/modules/shared/helpers/cryptoHelper'
import type { SavedViewGroup } from '@/modules/viewer/domain/types/savedViews'
import { InvalidSavedViewGroupIdError } from '@/modules/viewer/errors/savedViews'
import { ensureError, type MaybeNullOrUndefined } from '@speckle/shared'
import { isObjectLike } from 'lodash-es'

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

export const parseSavedViewGroupId = (
  id: string
): Pick<SavedViewGroup, 'projectId' | 'resourceIds' | 'name'> => {
  try {
    const json = base64Decode(id)
    const obj = JSON.parse(json)
    if (!isObjectLike(obj) || !obj.projectId || !obj.resourceIds || !obj.name) {
      throw new InvalidSavedViewGroupIdError('Invalid saved view group ID format')
    }
    return obj as Pick<SavedViewGroup, 'projectId' | 'resourceIds' | 'name'>
  } catch (e) {
    throw new InvalidSavedViewGroupIdError(undefined, {
      cause: ensureError(e)
    })
  }
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

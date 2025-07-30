import { base64Decode, base64Encode } from '@/modules/shared/helpers/cryptoHelper'
import type { Nullable } from '@speckle/shared'
import { isObjectLike } from 'lodash-es'

type DefaultGroupMetadata = {
  resourceIds: string[]
  projectId: string
  name: 'Default Group'
}

export const buildDefaultGroupId = (params: {
  resourceIds: string[]
  projectId: string
}) => {
  const payload: DefaultGroupMetadata = {
    resourceIds: params.resourceIds,
    projectId: params.projectId,
    name: 'Default Group'
  }
  const str = JSON.stringify(payload)
  return base64Encode(str)
}

export const decodeDefaultGroupId = (id: string): Nullable<DefaultGroupMetadata> => {
  try {
    const json = base64Decode(id)
    const obj = JSON.parse(json)
    if (
      !isObjectLike(obj) ||
      !obj.resourceIds ||
      !obj.projectId ||
      obj.name !== 'Default Group'
    ) {
      throw new Error('Invalid saved view group ID format')
    }
    return obj as Nullable<DefaultGroupMetadata>
  } catch {
    // Suppress - not the default group ID
    return null
  }
}

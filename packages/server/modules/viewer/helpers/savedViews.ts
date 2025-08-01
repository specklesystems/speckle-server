import { base64Decode, base64Encode } from '@/modules/shared/helpers/cryptoHelper'
import type { Nullable } from '@speckle/shared'
import {
  isModelResource,
  isObjectResource,
  resourceBuilder
} from '@speckle/shared/viewer/route'
import { isObjectLike } from 'lodash-es'

export type DefaultGroupMetadata = {
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
  return 'default-' + base64Encode(str)
}

export const decodeDefaultGroupId = (id: string): Nullable<DefaultGroupMetadata> => {
  try {
    if (!id.startsWith('default-')) return null
    const json = base64Decode(id.replace('default-', ''))
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

/**
 * Converts a resourceId string into a more abstract format used by groups that disregards
 * specific versions of models and objects.
 */
export const formatResourceIdsForGroup = (resourceIdString: string | string[]) => {
  resourceIdString = Array.isArray(resourceIdString)
    ? resourceIdString.join(',')
    : resourceIdString

  return resourceBuilder()
    .addFromString(resourceIdString)
    .forEach((r) => {
      if (isModelResource(r)) {
        // not interested in the specific version ids originally used
        r.versionId = undefined
      }
    })
    .filter((r) => {
      // filter out any resources that are not ViewerModelResource or ViewerObjectResource
      return isModelResource(r) || isObjectResource(r)
    })
    .map((r) => r.toString())
}

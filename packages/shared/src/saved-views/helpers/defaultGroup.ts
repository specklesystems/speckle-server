import { isObjectLike } from '#lodash'
import { Nullable } from '../../core/helpers/utilityTypes.js'
import { base64Decode, base64Encode } from '../../core/utils/base64.js'
import {
  isModelResource,
  isObjectResource,
  resourceBuilder,
  ViewerResourcesTarget
} from '../../viewer/helpers/route.js'

/**
 * Title used for the default 'Ungrouped Scenes' group in the saved views panel.
 */
export const ungroupedScenesGroupTitle = 'Ungrouped'

export type DefaultGroupMetadata = {
  resourceIds: string[]
  projectId: string
  name: 'Default Group'
}

/**
 * Converts a resourceId string into a more abstract format used by groups that disregards
 * specific versions of models and objects.
 */
export const formatResourceIdsForGroup = (resources: ViewerResourcesTarget) => {
  return resourceBuilder()
    .addResources(resources)
    .clearVersions()
    .filter((r) => {
      // filter out any resources that are not ViewerModelResource or ViewerObjectResource
      return isModelResource(r) || isObjectResource(r)
    })
    .map((r) => r.toString())
}

export const buildDefaultGroupId = (params: {
  resourceIds: string[]
  projectId: string
}) => {
  const payload: DefaultGroupMetadata = {
    resourceIds: formatResourceIdsForGroup(params.resourceIds),
    projectId: params.projectId,
    name: 'Default Group'
  }
  const str = JSON.stringify(payload)
  return 'default-' + base64Encode(str)
}

export const decodeDefaultGroupId = (id: string): Nullable<DefaultGroupMetadata> => {
  try {
    if (!isUngroupedGroup(id)) return null
    const json = base64Decode(id.replace('default-', ''))
    const obj = JSON.parse(json) as Record<string, unknown>
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

export const isUngroupedGroup = (groupId: string) => groupId.startsWith('default-')

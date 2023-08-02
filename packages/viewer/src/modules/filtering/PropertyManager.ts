import flatten from '../../helpers/flatten'
import { TreeNode, WorldTree } from '../tree/WorldTree'

export class PropertyManager {
  private propCache = {} as Record<string, PropertyInfo[]>

  /**
   *
   * @param resourceUrl The target resource's url. This must be an **object url** or null. If null, it will return the props for the whole scene.
   * @param bypassCache Forces a full rescan if set to true.
   * @returns a list of property infos containing basic information for filtering purposes.
   */
  public getProperties(
    tree: WorldTree,
    resourceUrl: string = null,
    bypassCache = false
  ): PropertyInfo[] {
    let rootNode: TreeNode = tree.root

    if (!bypassCache && this.propCache[resourceUrl ? resourceUrl : rootNode.model.id])
      return this.propCache[resourceUrl ? resourceUrl : rootNode.model.id]

    if (resourceUrl) {
      const actualRoot = rootNode.children.find((n) => n.model.id === resourceUrl)
      if (actualRoot) rootNode = actualRoot
      else {
        throw new Error(`Could not find root node for ${resourceUrl} - is it loaded?`)
      }
    }

    const propValues = {}

    tree.walk((node: TreeNode) => {
      if (!node.model.atomic) return true
      const obj = flatten(node.model.raw)
      for (const key in obj) {
        if (Array.isArray(obj[key])) continue
        if (!propValues[key]) propValues[key] = []
        propValues[key].push({ value: obj[key], id: obj.id })
      }
    }, rootNode)

    const allPropInfos: PropertyInfo[] = []

    for (const propKey in propValues) {
      const propValuesArr = propValues[propKey]
      const propInfo = {} as PropertyInfo
      propInfo.key = propKey
      propInfo.type = typeof propValuesArr[0].value === 'string' ? 'string' : 'number'
      propInfo.objectCount = propValuesArr.length

      // For string based props, keep track of which ids belong to which group
      if (propInfo.type === 'string') {
        const stringPropInfo = propInfo as StringPropertyInfo
        const valueGroups = {}
        for (const { value, id } of propValuesArr) {
          if (!valueGroups[value]) valueGroups[value] = []
          valueGroups[value].push(id)
        }
        stringPropInfo.valueGroups = []
        for (const key in valueGroups)
          stringPropInfo.valueGroups.push({ value: key, ids: valueGroups[key] })

        stringPropInfo.valueGroups = stringPropInfo.valueGroups.sort((a, b) =>
          a.value.localeCompare(b.value)
        )
      }
      // For numeric props, we keep track of min and max and all the {id, val}s
      if (propInfo.type === 'number') {
        const numProp = propInfo as NumericPropertyInfo
        numProp.min = Number.MAX_VALUE
        numProp.max = Number.MIN_VALUE
        for (const { value } of propValuesArr) {
          if (value < numProp.min) numProp.min = value
          if (value > numProp.max) numProp.max = value
        }
        numProp.valueGroups = propValuesArr.sort((a, b) => a.value - b.value)
        // const sorted = propValuesArr.sort((a, b) => a.value - b.value)
        // propInfo.sortedValues = sorted.map(s => s.value)
        // propInfo.sortedIds = sorted.map(s => s.value) // tl;dr: not worth it
      }
      allPropInfos.push(propInfo as PropertyInfo)
    }

    this.propCache[rootNode.model.id] = allPropInfos

    return allPropInfos
  }
}

/**
 * PropertyInfo types represent all of the properties that you can filter on in the viewer
 */

export interface PropertyInfo {
  /**
   * Property identifier, flattened
   */
  key: string
  /**
   * Total number of objects that have this property
   */
  objectCount: number
  type: 'number' | 'string'
}

export interface NumericPropertyInfo extends PropertyInfo {
  type: 'number'
  /**
   * Absolute min/max values that are available for this property
   */
  min: number
  max: number
  /**
   * An array of pairs of object IDs and their actual values for that property
   */
  valueGroups: { value: number; id: string }[]
  /**
   * User defined/filtered min/max that is bound within min/max above
   */
  passMin: number | null
  passMax: number | null
}

export interface StringPropertyInfo extends PropertyInfo {
  type: 'string'
  /**
   * An array of pairs of object IDs and their actual values for that property
   */
  valueGroups: { value: string; ids: string[] }[]
}

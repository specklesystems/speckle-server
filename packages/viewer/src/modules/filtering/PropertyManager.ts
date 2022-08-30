import flatten from '../../helpers/flatten'
import { TreeNode, WorldTree } from '../tree/WorldTree'

export class PropertyManager {
  private static WT: WorldTree = WorldTree.getInstance()

  private static propCache = {} as Record<string, PropertyInfo[]>

  /**
   *
   * @param resourceUrl The target resource's url. This must be an **object url** or null. If null, it will return the props for the whole scene.
   * @param bypassCache Forces a full rescan if set to true.
   * @returns a list of property infos containing basic information for filtering purposes.
   */
  public static getProperties(
    resourceUrl: string = null,
    bypassCache = false
  ): PropertyInfo[] {
    let rootNode: TreeNode = PropertyManager.WT.root

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

    PropertyManager.WT.walk((node: TreeNode) => {
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
      const propInfo = {} as any
      propInfo.key = propKey
      propInfo.type = typeof propValuesArr[0].value
      propInfo.objectCount = propValuesArr.length

      // For string based props, keep track of which ids belong to which group
      if (propInfo.type === 'string') {
        const valueGroups = {}
        for (const { value, id } of propValuesArr) {
          if (!valueGroups[value]) valueGroups[value] = []
          valueGroups[value].push(id)
        }
        const valueMaps = []
        for (const key in valueGroups)
          valueMaps.push({ value: key, ids: valueGroups[key] })

        propInfo.valueGroups = valueMaps.sort((a, b) => a.value.localeCompare(b.value))
      }
      // For numeric props, we keep track of min and max and all the {id, val}s
      if (propInfo.type === 'number') {
        propInfo.min = Number.MAX_VALUE
        propInfo.max = Number.MIN_VALUE
        for (const { value } of propValuesArr) {
          if (value < propInfo.min) propInfo.min = value
          if (value > propInfo.max) propInfo.max = value
        }
        propInfo.valueGroups = propValuesArr.sort((a, b) => a.value - b.value)
        // const sorted = propValuesArr.sort((a, b) => a.value - b.value)
        // propInfo.sortedValues = sorted.map(s => s.value)
        // propInfo.sortedIds = sorted.map(s => s.value) // tl;dr: not worth it
      }
      allPropInfos.push(propInfo)
    }

    this.propCache[rootNode.model.id] = allPropInfos

    return allPropInfos
  }
}

export interface PropertyInfo {
  key: string
  count: number
  objectCount: number
  type: 'number' | 'string'
}

export interface NumericPropertyInfo extends PropertyInfo {
  type: 'number'
  min: number
  max: number
  valueGroups: [{ value: number; id: string }]
  passMin: number | null
  passMax: number | null
}

export interface StringPropertyInfo extends PropertyInfo {
  type: 'number'
  valueGroups: [{ value: string; ids: string[] }]
}

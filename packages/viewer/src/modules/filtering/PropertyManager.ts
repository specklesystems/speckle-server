import flatten from '../../helpers/flatten.js'
import { type TreeNode, WorldTree } from '../tree/WorldTree.js'
import { Document } from 'flexsearch'

interface PropertyResult {
  id: string
  doc: PropertyDocument
}

interface PropertyDocument {
  key: string
  value: string
  objectId: string
}

export class PropertyManager {
  private propCache = {} as Record<string, PropertyInfo[]>
  private searchIndices = {} as Record<string, Document>

  /**
   *
   * @param resourceUrl The target resource's url. This must be an **object url** or null. If null, it will return the props for the whole scene.
   * @param bypassCache Forces a full rescan if set to true.
   * @returns a list of property infos containing basic information for filtering purposes.
   */
  public async getProperties(
    tree: WorldTree,
    resourceUrl: string | null = null,
    bypassCache = false
  ): Promise<PropertyInfo[]> {
    let rootNode: TreeNode = tree.root
    const cacheKey = resourceUrl ? resourceUrl : rootNode.model.id

    if (!bypassCache && this.propCache[cacheKey]) return this.propCache[cacheKey]

    if (resourceUrl) {
      const actualRoot = rootNode.children.find(
        (n: { model: { id: string } }) => n.model.id === resourceUrl
      )
      if (actualRoot) rootNode = actualRoot
      else {
        throw new Error(`Could not find root node for ${resourceUrl} - is it loaded?`)
      }
    }

    // Initialize FlexSearch index for this resource
    const searchIndex = new Document({
      document: {
        id: 'id',
        index: ['key', 'value', 'objectId'],
        store: ['key', 'value', 'objectId']
      },
      preset: 'match', // Enables fuzzy search
      tokenize: 'full' // Good for substring/fuzzy
    })

    const propValues: { [key: string]: unknown } = {}
    let docId = 0 // Counter for document IDs in the search index

    await tree.walkAsync((node: TreeNode) => {
      if (!node.model.atomic) return true
      const obj = flatten(node.model.raw)
      for (const key in obj) {
        if (Array.isArray(obj[key])) continue
        if (!propValues[key]) propValues[key] = []

        const value = obj[key]
        const objectId = obj.id

        // Add to propValues for backward compatibility
        ;(propValues[key] as Array<unknown>).push({ value, id: objectId })

        // Add to search index
        searchIndex.add({
          id: (docId++).toString(),
          key,
          value: typeof value === 'string' ? value : String(value),
          objectId: String(objectId)
        })
      }
      return true
    }, rootNode)

    // Store the search index
    this.searchIndices[cacheKey] = searchIndex

    const allPropInfos: PropertyInfo[] = []

    for (const propKey in propValues) {
      const propValuesArr = propValues[propKey]
      const propInfo = {} as PropertyInfo
      propInfo.key = propKey
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      propInfo.type = typeof propValuesArr[0].value === 'string' ? 'string' : 'number'
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      propInfo.objectCount = propValuesArr.length

      // For string based props, keep track of which ids belong to which group
      if (propInfo.type === 'string') {
        const stringPropInfo = propInfo as StringPropertyInfo
        const valueGroups = {}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        for (const { value, id } of propValuesArr) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          if (!valueGroups[value]) valueGroups[value] = []
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          valueGroups[value].push(id)
        }
        stringPropInfo.valueGroups = []
        for (const key in valueGroups) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          stringPropInfo.valueGroups.push({ value: key, ids: valueGroups[key] })
        }

        stringPropInfo.valueGroups = stringPropInfo.valueGroups.sort((a, b) =>
          a.value.localeCompare(b.value)
        )
      }
      // For numeric props, we keep track of min and max and all the {id, val}s
      if (propInfo.type === 'number') {
        const numProp = propInfo as NumericPropertyInfo
        numProp.min = Number.MAX_VALUE
        numProp.max = Number.MIN_VALUE
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        for (const { value } of propValuesArr) {
          if (value < numProp.min) numProp.min = value
          if (value > numProp.max) numProp.max = value
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        numProp.valueGroups = propValuesArr.sort((a, b) => a.value - b.value)
        // const sorted = propValuesArr.sort((a, b) => a.value - b.value)
        // propInfo.sortedValues = sorted.map(s => s.value)
        // propInfo.sortedIds = sorted.map(s => s.value) // tl;dr: not worth it
      }
      allPropInfos.push(propInfo)
    }

    this.propCache[rootNode.model.id] = allPropInfos

    return allPropInfos
  }

  /**
   * Search for properties by a query string
   * @param resourceUrl The target resource's url or null for the whole scene
   * @param query The search query
   * @returns Array of search results containing property keys, values, and object IDs
   */
  public searchProperties(
    resourceUrl: string | null = null,
    query: string
  ): SearchResult[] {
    const cacheKey = resourceUrl || 'ROOT'

    // Make sure the index exists
    if (!this.searchIndices[cacheKey]) {
      console.warn(
        `No search index available for ${cacheKey}. Call getProperties first.`
      )
      return []
    }

    const index = this.searchIndices[cacheKey]
    const results = index.search({
      query,
      field: ['value'],
      enrich: true,
      limit: 100,
      suggest: true // Enables fuzzy suggestions
    })

    // Process and flatten results
    const searchResults: SearchResult[] = []

    for (const item of results) {
      const result = item.result as unknown[] as PropertyResult[]
      for (const r of result) {
        if (r.doc) {
          searchResults.push({
            key: r.doc.key,
            value: r.doc.value,
            objectId: r.doc.objectId
          })
        }
      }
    }

    return searchResults
  }
}

/**
 * SearchResult represents a result from a FlexSearch query
 */
export interface SearchResult {
  key: string
  value: string
  objectId: string
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

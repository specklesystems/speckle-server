import { Base, SearchQuery, SearchResult } from '../types/types.js'
import FlexSearch, { Document } from 'flexsearch'

interface IndexDoc {
  id: string
  key: string
  value: string
  [key: string]: string
}

export class PropertyManager {
  private index: Document<IndexDoc, true>

  constructor() {
    this.index = new FlexSearch.Document({
      document: {
        id: 'id',
        index: ['value'],
        store: ['key', 'value']
      },
      tokenize: 'full'
    })
  }

  public async indexProperties(base: Base): Promise<void> {
    if (!base.properties) return

    const properties = this.flattenProperties(base.id, base.properties)
    for (const prop of properties) {
      const doc: IndexDoc = {
        id: prop.id,
        key: prop.key,
        value: prop.value
      }
      await this.index.addAsync(doc)
    }
  }

  private flattenProperties(
    objectId: string,
    properties: Record<string, unknown>
  ): Array<{ id: string; key: string; value: string }> {
    const flatProps: Array<{ id: string; key: string; value: string }> = []
    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        const value = properties[key]
        if (typeof value === 'object' && value !== null) {
          flatProps.push(
            ...this.flattenProperties(objectId, value as Record<string, unknown>)
          )
        } else {
          flatProps.push({
            id: `${objectId}-${key}`,
            key,
            value: String(value)
          })
        }
      }
    }
    return flatProps
  }

  public async search(query: SearchQuery): Promise<SearchResult[]> {
    const { operator, queries } = query
    const searchResults: Set<string> = new Set()

    const queryPromises = queries.map((q) => {
      return this.index.searchAsync(q.value, {
        index: 'value',
        suggest: true
      })
    })

    const resultsPerQuery = (await Promise.all(
      queryPromises
    ));

    for (let i = 0; i < resultsPerQuery.length; i++) {
      const results = resultsPerQuery[i]
      const q = queries[i]
      const objectIds = new Set<string>()
      results.forEach((fieldResult) => {
        fieldResult.result.forEach((doc) => {
          if (doc === q.key) {
            objectIds.add(doc.split('-')[0])
          }
        })
      })

      if (i === 0) {
        objectIds.forEach((id) => searchResults.add(id))
      } else {
        if (operator === 'AND') {
          const intersection = new Set(
            [...searchResults].filter((x) => objectIds.has(x))
          )
          searchResults.clear()
          intersection.forEach((id) => searchResults.add(id))
        } else {
          objectIds.forEach((id) => searchResults.add(id))
        }
      }
    }

    const finalResults: SearchResult[] = []
    searchResults.forEach((objectId) => {
      queries.forEach((q) => {
        finalResults.push({
          key: q.key,
          value: q.value,
          objectId
        })
      })
    })

    return finalResults
  }

  public clearPropertyIndex(): void {
    this.index = new FlexSearch.Document({
      document: {
        id: 'id',
        index: ['value'],
        store: ['key', 'value']
      },
      tokenize: 'full'
    })
  }
}

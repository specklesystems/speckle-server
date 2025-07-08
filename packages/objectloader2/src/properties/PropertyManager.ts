import { Base, SearchQuery, SearchResult } from '../types/types.js'
import { Charset, Document, DocumentData } from 'flexsearch'

export class PropertyManager {
  private index: Document
  private count: number = 0

  constructor() {
    this.index = new Document({
      document: {
        id: 'id',
        index: ['key', 'value'],
        store: ['id', 'key', 'value']
      },
      encoder: Charset.Normalize,
      tokenize: 'full'
    })
  }

  public getStats(): string {
    return `Count: ${this.count}`
  }

  public indexProperties(base: Base): void {
    if (
      !base ||
      base.speckle_type === 'Speckle.Core.Models.DataChunk' ||
      base.speckle_type === 'Objects.Geometry.Mesh'
    ) {
      return
    }

    const properties = this.flattenObject(
      base as unknown as Record<string, unknown>,
      ['id', 'referencedId', '__closure'],
      ['null', 'undefined', '[]', '{}', '""', 'reference']
    )
    for (const prop of Object.keys(properties)) {
      const doc: DocumentData = {
        id: base.id,
        key: prop,
        value: JSON.stringify(properties[prop])
      }
      this.index.add(this.count++, doc)
    }
  }

  private flattenObject(
    obj: Record<string, unknown>,
    keysToIgnore: string[] = [],
    valuesToIgnore: string[] = [],
    prefix: string = ''
  ): Record<string, unknown> {
    return Object.keys(obj).reduce((acc: Record<string, unknown>, key: string) => {
      if (keysToIgnore.includes(key)) {
        return acc // Skip keys that are in the ignore list
      }
      const currentKey = prefix ? `${prefix}.${key}` : key
      const value = obj[key]
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(
          acc,
          this.flattenObject(
            value as Record<string, unknown>,
            keysToIgnore,
            valuesToIgnore,
            currentKey
          )
        )
      } else if (Array.isArray(value)) {
        // Handle arrays: flatten each element with indexed keys
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            Object.assign(
              acc,
              this.flattenObject(
                item as Record<string, unknown>,
                keysToIgnore,
                valuesToIgnore,
                `${currentKey}.${index}`
              )
            )
          } else {
            acc[`${currentKey}.${index}`] = item
          }
        })
      } else {
        if (valuesToIgnore.includes(String(value))) {
          return acc // Skip keys that are in the ignore list
        }
        // Assign primitive values directly
        acc[currentKey] = value
      }
      return acc
    }, {})
  }

  public async search(query: SearchQuery): Promise<SearchResult[]> {
    const { queries } = query

    const resultsPerQuery = await this.index.searchAsync(queries[0].value, {
      enrich: true,
      limit: 50,
      suggest: true
    })

    const finalResults: SearchResult[] = []
    resultsPerQuery.forEach((q) => {
      q.result.forEach((r) => {
        if (!r.doc) {
          return // Skip if no document found
        }
        finalResults.push({
          id: r.doc['id'] as string,
          key: r.doc['key'] as string,
          value: r.doc['value'] as string
        })
      })
    })

    return finalResults
  }
}

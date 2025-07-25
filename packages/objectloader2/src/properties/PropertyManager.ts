import { flattenBase } from '../types/flatten.js'
import { Base } from '../types/types.js'

type FlattenedBase = { id: string; value: string | number }
type PropertyValues = Record<string, FlattenedBase[]>

export class PropertyManager {
  private properties: PropertyInfo[] = []
  private propValues: PropertyValues = {}

  public addBase(base: Base): void {
    const obj = flattenBase(base)
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        continue
      }
      if (!this.propValues[key]) {
        this.propValues[key] = []
      }
      this.propValues[key].push({ value: obj[key], id: obj.id as string })
    }
  }

  public finalize(): void {
    for (const propKey in this.propValues) {
      const propValuesArr = this.propValues[propKey]
      const propInfo = {} as PropertyInfo
      propInfo.key = propKey

      propInfo.type = typeof propValuesArr[0].value === 'string' ? 'string' : 'number'
      propInfo.objectCount = propValuesArr.length

      // For string based props, keep track of which ids belong to which group
      if (propInfo.type === 'string') {
        const stringPropInfo = propInfo as StringPropertyInfo
        const valueGroups = {} as { [key: string]: string[] }
        for (const { value, id } of propValuesArr) {
          if (!valueGroups[value]) {
            valueGroups[value] = []
          }
          valueGroups[value].push(id)
        }
        stringPropInfo.valueGroups = []
        for (const key in valueGroups) {
          stringPropInfo.valueGroups.push({ value: key, ids: valueGroups[key] })
        }

        stringPropInfo.valueGroups = stringPropInfo.valueGroups.sort((a, b) =>
          a.value.localeCompare(b.value)
        )
      }
      // For numeric props, we keep track of min and max and all the {id, val}s
      else if (propInfo.type === 'number') {
        const numProp = propInfo as NumericPropertyInfo
        numProp.min = Number.MAX_VALUE
        numProp.max = Number.MIN_VALUE
        for (const { value } of propValuesArr) {
          if (typeof value !== 'number') continue // skip non-numeric values
          if (value < numProp.min) numProp.min = value
          if (value > numProp.max) numProp.max = value
        }
        numProp.valueGroups = (propValuesArr as unknown as NumberType[]).sort(
          (a, b) => a.value - b.value
        )
        // const sorted = propValuesArr.sort((a, b) => a.value - b.value)
        // propInfo.sortedValues = sorted.map(s => s.value)
        // propInfo.sortedIds = sorted.map(s => s.value) // tl;dr: not worth it
      } else {
        // Handle unsupported property types
        console.warn(`Unsupported property type "${propInfo.type}" for property "${propInfo.key}"`)
      }
      this.properties.push(propInfo)
    }
  }

  public getProperties(): PropertyInfo[] {
    this.finalize()
    return this.properties
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
  valueGroups: NumberType[]
  /**
   * User defined/filtered min/max that is bound within min/max above
   */
  passMin: number | null
  passMax: number | null
}

export interface NumberType {
  ids: string[]
  value: number
}

export interface StringPropertyInfo extends PropertyInfo {
  type: 'string'
  /**
   * An array of pairs of object IDs and their actual values for that property
   */
  valueGroups: StringType[]
}

export interface StringType {
  ids: string[]
  value: string
}

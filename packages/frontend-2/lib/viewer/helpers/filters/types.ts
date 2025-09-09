import type { Nullable } from '@speckle/shared'
import type {
  NumericPropertyInfo,
  StringPropertyInfo,
  PropertyInfo,
  Viewer,
  SpeckleObject
} from '@speckle/viewer'

// Filter Conditions
export enum NumericFilterCondition {
  IsBetween = 'is_between',
  IsEqualTo = 'is_equal_to',
  IsNotEqualTo = 'is_not_equal_to',
  IsGreaterThan = 'is_greater_than',
  IsLessThan = 'is_less_than'
}

export enum StringFilterCondition {
  Is = 'is',
  IsNot = 'is_not'
}

export enum ExistenceFilterCondition {
  IsSet = 'is_set',
  IsNotSet = 'is_not_set'
}

export type FilterCondition =
  | NumericFilterCondition
  | StringFilterCondition
  | ExistenceFilterCondition

// Filter Enums
export enum FilterLogic {
  All = 'all',
  Any = 'any'
}

export enum FilterType {
  String = 'string',
  Numeric = 'numeric'
}

export enum SortMode {
  Alphabetical = 'alphabetical',
  SelectedFirst = 'selected-first'
}

// Filter Data Types
type BaseFilterData = {
  id: string
  isApplied: boolean
  selectedValues: string[]
  condition: FilterCondition
}

export type NumericFilterData = BaseFilterData & {
  type: FilterType.Numeric
  filter: NumericPropertyInfo
  numericRange: { min: number; max: number }
  hasConstantValue?: boolean
  hasNearZeroRange?: boolean
  rangeDisabledReason?: string
}

export type StringFilterData = BaseFilterData & {
  type: FilterType.String
  filter: StringPropertyInfo
  isDefaultAllSelected?: boolean
}

export type FilterData = NumericFilterData | StringFilterData

export const isNumericFilter = (filter: FilterData): filter is NumericFilterData => {
  return filter.type === FilterType.Numeric
}

export const isExistenceCondition = (condition: FilterCondition): boolean => {
  return (
    condition === ExistenceFilterCondition.IsSet ||
    condition === ExistenceFilterCondition.IsNotSet
  )
}

// Component Option Types
export type PropertySelectOption = {
  value: string
  label: string
  parentPath: string
  type: FilterType
  hasParent: boolean
}

export type ConditionOption = {
  value: FilterCondition
  label: string
}

// Property Selection Types (extracted from components)
export type PropertyOption = PropertySelectOption // Alias for backward compatibility

export type PropertySelectionListItem = {
  type: 'header' | 'property'
  title?: string
  property?: PropertyOption
}

export type CreateFilterParams = {
  filter: PropertyInfo
  id: string
  availableValues?: string[]
}

// Internal Data Types
export type PropertyInfoBase = {
  concatenatedPath: string
  value: string | number
  type: FilterType
}

export type DataSlice = {
  id: string
  widgetId: string
  name: string
  objectIds: string[]
  intersectedObjectIds?: string[]
}

export type QueryCriteria = {
  propertyKey: string
  condition: FilterCondition
  values: string[]
  minValue?: number
  maxValue?: number
}

export type DataSource = {
  resourceUrl: string
  viewerInstance: Viewer
  rootObject: Nullable<SpeckleObject>
  objectMap: Record<string, SpeckleObject>
  propertyMap: Record<string, PropertyInfoBase>
  objectProperties: Record<string, Record<string, unknown>>
}

export type ResourceInfo = {
  resourceUrl: string
}

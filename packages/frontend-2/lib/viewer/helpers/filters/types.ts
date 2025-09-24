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

export enum BooleanFilterCondition {
  IsTrue = 'is_true',
  IsFalse = 'is_false'
}

export enum ArrayFilterCondition {
  Contains = 'contains',
  DoesNotContain = 'does_not_contain',
  IsEmpty = 'is_empty',
  IsNotEmpty = 'is_not_empty'
}

export type FilterCondition =
  | NumericFilterCondition
  | StringFilterCondition
  | ExistenceFilterCondition
  | BooleanFilterCondition
  | ArrayFilterCondition

// Filter Enums
export enum FilterLogic {
  All = 'all',
  Any = 'any'
}

export enum FilterType {
  String = 'string',
  Numeric = 'numeric',
  Boolean = 'boolean',
  Array = 'array'
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

export type ExtendedPropertyInfo =
  | PropertyInfo
  | {
      key: string
      objectCount: number
      type: 'boolean'
      valueGroups: { value: boolean; ids: string[] }[]
    }
  | ArrayPropertyInfo

export type BooleanPropertyInfo = Extract<ExtendedPropertyInfo, { type: 'boolean' }>

export type BooleanFilterData = BaseFilterData & {
  type: FilterType.Boolean
  filter: BooleanPropertyInfo
}

export type ArrayPropertyInfo = {
  key: string
  objectCount: number
  type: 'array'
  valueGroups: { value: unknown[]; ids: string[] }[]
}

export type ArrayFilterData = BaseFilterData & {
  type: FilterType.Array
  filter: ArrayPropertyInfo
  searchValue?: string // For contains/does not contain
}

export type FilterData =
  | NumericFilterData
  | StringFilterData
  | BooleanFilterData
  | ArrayFilterData

export const isNumericFilter = (filter: FilterData): filter is NumericFilterData => {
  return filter.type === FilterType.Numeric
}

export const isBooleanFilter = (filter: FilterData): filter is BooleanFilterData => {
  return filter.type === FilterType.Boolean
}

export const isArrayFilter = (filter: FilterData): filter is ArrayFilterData => {
  return filter.type === FilterType.Array
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
  filter: ExtendedPropertyInfo
  id: string
  availableValues?: string[]
}

// Property Extractor Types
export type PropertyInfoBase = {
  path: string[]
  concatenatedPath: string
  type: string
  name: string
}

// Internal Data Types (for filtering system)
export type FilteringPropertyInfo = {
  concatenatedPath: string
  value: string | number
  type: FilterType
}

export type PropertyInfoValue = {
  value: unknown
} & PropertyInfoBase

export type Parameter = {
  units?: string
} & PropertyInfoValue

export type RevitMaterialPropertyInfo = {
  materialCategory: string
  materialClass: string
} & Parameter

export type RevitMaterialInfo = {
  materialCategory: string
  materialClass: string
  area: { units: string; value: number }
  volume: { units: string; value: number }
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
  searchValue?: string // For array contains/does not contain
}

export type DataSource = {
  resourceUrl: string
  viewerInstance: Viewer
  rootObject: Nullable<SpeckleObject>
  objectMap: Record<string, SpeckleObject>
  propertyMap: Record<string, FilteringPropertyInfo>
  objectProperties: Record<string, Record<string, unknown>>
}

export type ResourceInfo = {
  resourceUrl: string
}

// Value Groups Map Types
export type ValueGroupMapItem = {
  value: string | number
  ids?: string[]
}

export type ValueGroupsMap = Map<string, ValueGroupMapItem>

export type ColorGroup = {
  value: string
  color: string
}

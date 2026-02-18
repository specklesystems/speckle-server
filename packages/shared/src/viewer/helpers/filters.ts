import { z } from 'zod'

/**
 * Filter condition enums as Zod schemas
 */
export const NumericFilterConditionSchema = z.enum([
  'is_between',
  'is_equal_to',
  'is_not_equal_to',
  'is_greater_than',
  'is_less_than'
])

export const StringFilterConditionSchema = z.enum(['is', 'is_not'])

export const ExistenceFilterConditionSchema = z.enum(['is_set', 'is_not_set'])

export const BooleanFilterConditionSchema = z.enum(['is_true', 'is_false'])

/**
 * Union of all filter conditions
 */
export const FilterConditionSchema = z.union([
  NumericFilterConditionSchema,
  StringFilterConditionSchema,
  ExistenceFilterConditionSchema,
  BooleanFilterConditionSchema
])

/**
 * Filter logic (AND/OR)
 */
export const FilterLogicSchema = z.enum(['all', 'any'])

/**
 * Base schema shared by all filter types
 */
const BaseSerializedFilterSchema = z.object({
  key: z.string().nullable(),
  isApplied: z.boolean(),
  id: z.string()
})

/**
 * Numeric filter schema
 * Must include numericRange, selectedValues typically empty
 */
export const NumericSerializedFilterSchema = BaseSerializedFilterSchema.extend({
  type: z.literal('numeric'),
  selectedValues: z.array(z.string()),
  condition: z.union([NumericFilterConditionSchema, ExistenceFilterConditionSchema]),
  numericRange: z.object({
    min: z.number(),
    max: z.number()
  })
})

/**
 * String filter schema
 * Must include selectedValues, no numericRange
 */
export const StringSerializedFilterSchema = BaseSerializedFilterSchema.extend({
  type: z.literal('string'),
  selectedValues: z.array(z.string()),
  condition: z.union([StringFilterConditionSchema, ExistenceFilterConditionSchema])
})

/**
 * Boolean filter schema
 * Condition determines the boolean value, selectedValues typically empty
 */
export const BooleanSerializedFilterSchema = BaseSerializedFilterSchema.extend({
  type: z.literal('boolean'),
  selectedValues: z.array(z.string()),
  condition: z.union([BooleanFilterConditionSchema, ExistenceFilterConditionSchema])
})

/**
 * Discriminated union of all filter types
 */
export const SerializedFilterDataSchema = z.discriminatedUnion('type', [
  NumericSerializedFilterSchema,
  StringSerializedFilterSchema,
  BooleanSerializedFilterSchema
])

/**
 * Query criteria for filtering objects
 */
export const QueryCriteriaSchema = z.object({
  propertyKey: z.string(),
  condition: FilterConditionSchema,
  values: z.array(z.string()),
  minValue: z.number().optional(),
  maxValue: z.number().optional()
})

/**
 * Exported TypeScript types (inferred from Zod schemas)
 */
export type NumericFilterCondition = z.infer<typeof NumericFilterConditionSchema>
export type StringFilterCondition = z.infer<typeof StringFilterConditionSchema>
export type ExistenceFilterCondition = z.infer<typeof ExistenceFilterConditionSchema>
export type BooleanFilterCondition = z.infer<typeof BooleanFilterConditionSchema>
export type FilterCondition = z.infer<typeof FilterConditionSchema>
export type FilterLogic = z.infer<typeof FilterLogicSchema>

// Individual filter types
export type NumericSerializedFilter = z.infer<typeof NumericSerializedFilterSchema>
export type StringSerializedFilter = z.infer<typeof StringSerializedFilterSchema>
export type BooleanSerializedFilter = z.infer<typeof BooleanSerializedFilterSchema>

// Discriminated union type
export type SerializedFilterData = z.infer<typeof SerializedFilterDataSchema>

export type QueryCriteria = z.infer<typeof QueryCriteriaSchema>

/**
 * Runtime enum values extracted from Zod schemas
 * These are the actual string values that can be used at runtime
 */
export const NumericFilterConditionValues = NumericFilterConditionSchema.enum
export const StringFilterConditionValues = StringFilterConditionSchema.enum
export const ExistenceFilterConditionValues = ExistenceFilterConditionSchema.enum
export const BooleanFilterConditionValues = BooleanFilterConditionSchema.enum
export const FilterLogicValues = FilterLogicSchema.enum

/**
 * Helper function to validate and parse filter data
 */
export const parseSerializedFilters = (
  data: unknown
):
  | { success: true; data: SerializedFilterData[] }
  | { success: false; error: z.ZodError } => {
  const result = z.array(SerializedFilterDataSchema).safeParse(data)
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error }
}

/**
 * Helper function to validate and parse query criteria
 */
export const parseQueryCriteria = (
  data: unknown
): { success: true; data: QueryCriteria } | { success: false; error: z.ZodError } => {
  const result = QueryCriteriaSchema.safeParse(data)
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error }
}

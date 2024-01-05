import { DateTimeResolver, BigIntResolver, JSONObjectResolver } from 'graphql-scalars'

export const scalarResolvers = {
  DateTime: DateTimeResolver,
  BigInt: BigIntResolver,
  JSONObject: JSONObjectResolver
}

export const scalarSchemas = `
scalar DateTime

scalar EmailAddress

scalar BigInt

scalar JSONObject

`

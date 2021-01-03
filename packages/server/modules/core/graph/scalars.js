const { DateTimeResolver, BigIntResolver, JSONObjectResolver } = require( 'graphql-scalars' )

exports.scalarResolvers = { DateTime: DateTimeResolver, BigInt: BigIntResolver, JSONObject: JSONObjectResolver }

exports.scalarSchemas = `
scalar DateTime

scalar EmailAddress

scalar BigInt

scalar JSONObject

`
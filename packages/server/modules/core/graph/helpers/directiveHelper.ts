import { GraphQLSchema } from 'graphql'

export type SchemaTransformer = (schema: GraphQLSchema) => GraphQLSchema

/**
 * Type for a function that builds an Apollo Server v3 compatible GraphQL directive
 * @see https://www.graphql-tools.com/docs/schema-directives
 */
export type GraphqlDirectiveBuilder = () => {
  /**
   * Type definitions of the directive
   */
  typeDefs: string
  /**
   * Transformer that uses 'mapSchema' of '@graphql-tools/utils' to adjust the schema
   * with the necessary directive logic
   */
  schemaTransformer: SchemaTransformer
}

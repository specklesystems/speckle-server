/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApolloServer } from 'apollo-server-express'
import { GraphQLResponse } from 'apollo-server-types'
import { DocumentNode } from 'graphql'
import { Nullable } from '@/modules/shared/helpers/typeHelper'

type TypedGraphqlResponse<R = Record<string, any>> = GraphQLResponse & {
  data: Nullable<R>
}

/**
 * Use this to execute GQL operations from tests against an Apollo instance and get
 * a properly typed response
 */
export async function executeOperation<
  R = Record<string, any>,
  V = Record<string, unknown>
>(
  apollo: ApolloServer,
  query: DocumentNode,
  variables?: V
): Promise<TypedGraphqlResponse<R>> {
  return (await apollo.executeOperation({
    query,
    variables
  })) as TypedGraphqlResponse<R>
}

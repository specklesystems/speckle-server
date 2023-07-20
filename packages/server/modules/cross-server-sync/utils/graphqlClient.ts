import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  HttpLink,
  gql,
  ApolloQueryResult
} from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { getServerVersion } from '@/modules/shared/helpers/envHelper'
import { CrossSyncClientTestQuery } from '@/modules/cross-server-sync/graph/generated/graphql'

export type GraphQLClient = ApolloClient<NormalizedCacheObject>

const testQuery = gql`
  query CrossSyncClientTest {
    _
  }
`

export const assertValidGraphQLResult = (
  res: ApolloQueryResult<unknown>,
  operationName: string
) => {
  if (res.errors?.length) {
    throw new Error(
      `GQL operation '${operationName}' failed because of errors: ` +
        JSON.stringify(res.errors)
    )
  }
}

export const createApolloClient = async (
  origin: string,
  params?: { token?: string }
): Promise<GraphQLClient> => {
  const cache = new InMemoryCache()

  const baseLink = new HttpLink({ uri: `${origin}/graphql`, fetch })
  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: params?.token ? `Bearer ${params.token}` : ''
      }
    }
  })

  const client = new ApolloClient({
    link: authLink.concat(baseLink),
    cache,
    name: 'cli',
    version: getServerVersion(),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }
    }
  })

  // Test it out
  const res = await client.query<CrossSyncClientTestQuery>({
    query: testQuery
  })

  assertValidGraphQLResult(res, 'Target server test query')

  if (!res.data?._) {
    throw new Error(
      "Couldn't construct working Apollo Client, test query failed cause of unexpected response: " +
        JSON.stringify(res.data)
    )
  }

  return client
}

export { gql }

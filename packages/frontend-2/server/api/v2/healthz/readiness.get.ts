import {
  ApolloClient,
  ApolloQueryResult,
  gql,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject
} from '@apollo/client/core'

type GraphQLClient = ApolloClient<NormalizedCacheObject>

const serverInfoVersionQuery = gql`
  query serverInfo {
    version
  }
`

export default defineEventHandler(() => {
  // as part of creating the apollo client it checks that the server can be reached
  return createApolloClient('apiOrigin') //FIXME there's some magic going on with the config that clearly isn't applied here (yet?)
    .then(() => {
      return {
        status: 'ready'
      }
    })
    .catch(() => {
      throw createError({
        statusCode: 500,
        name: 'InternalServerError',
        message:
          'Frontend is unable to reach the Graphql server, or the server is unable to query the database',
        statusMessage: 'Internal Server Error'
      })
    })
})

// TODO copied from packages/server/modules/cli/commands/download/commit.ts
// most likely a better place to put the below
const createApolloClient = async (origin: string): Promise<GraphQLClient> => {
  const cache = new InMemoryCache()
  const client = new ApolloClient({
    link: new HttpLink({ uri: `${origin}/graphql`, fetch }),
    cache,
    name: 'cli',
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }
    }
  })

  const res = await client.query({
    query: serverInfoVersionQuery
  })

  assertValidGraphQLResult(res, 'Target server test query')

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!res.data?._) {
    throw new Error(
      "Couldn't construct working Apollo Client, test query failed cause of unexpected response: " +
        JSON.stringify(res.data)
    )
  }

  return client
}

const assertValidGraphQLResult = (
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

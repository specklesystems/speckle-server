import * as ApolloComposable from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'

const serverInfoVersionQuery = graphql(`
  query ReadinessCheckMetadata {
    serverInfo {
      version
    }
  }
`)

export default defineEventHandler(async () => {
  const client = ApolloComposable.useApolloClient().client
  const { data, error } = await client.query({ query: serverInfoVersionQuery })
  if (error) {
    throw createError({
      statusCode: 500,
      cause: error,
      name: 'InternalServerError',
      message:
        'Frontend is unable to reach the Graphql server, or the server is unable to query the database',
      statusMessage: 'Internal Server Error'
    })
  }

  if (data) {
    return {
      status: 'ready',
      server: {
        version: data.serverInfo.version
      }
    }
  }

  throw createError({
    statusCode: 500,
    name: 'InternalServerError',
    message:
      'Frontend was able to reach the Graphql server, but invalid data was returned.',
    statusMessage: 'Internal Server Error'
  })
})

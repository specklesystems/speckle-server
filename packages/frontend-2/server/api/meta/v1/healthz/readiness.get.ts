import * as ApolloComposable from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'

const serverInfoVersionQuery = graphql(`
  query ServerVersion {
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
      name: 'InternalServerError',
      message:
        'Frontend is unable to reach the Graphql server, or the server is unable to query the database',
      statusMessage: 'Internal Server Error'
    })
  }

  if (data) {
    return {
      status: 'ready'
    }
  }
})

import {
  apolloMockRequestWithDefaults,
  MockedApolloFetchResult
} from '~~/lib/fake-nuxt-env/utils/betterMockLink'
import {
  AuthServerInfoQuery,
  AuthServerInfoQueryVariables
} from '~~/lib/common/generated/gql/graphql'
import { AuthStrategy } from '~~/lib/auth/helpers/strategies'

export const mockLoginServerInfoQuery = apolloMockRequestWithDefaults<
  AuthServerInfoQuery,
  AuthServerInfoQueryVariables
>({
  request: ({ operationName }) => operationName === 'AuthServerInfo',
  result: (): MockedApolloFetchResult<AuthServerInfoQuery> => ({
    data: {
      __typename: 'Query',
      serverInfo: {
        __typename: 'ServerInfo',
        authStrategies: [
          {
            id: AuthStrategy.Local,
            name: 'Local',
            url: '/',
            __typename: 'AuthStrategy'
          },
          {
            id: AuthStrategy.Google,
            name: 'Google',
            url: 'https://google.com',
            __typename: 'AuthStrategy'
          },
          {
            id: AuthStrategy.Github,
            name: 'Github',
            url: 'https://github.com',
            __typename: 'AuthStrategy'
          },
          {
            id: AuthStrategy.AzureAD,
            name: 'Azure',
            url: 'https://microsoft.com',
            __typename: 'AuthStrategy'
          }
        ],
        termsOfService:
          'This piece of text is managed by server admins! You agree to our Terms of Use and Privacy policy.',
        inviteOnly: false
      }
    }
  })
})

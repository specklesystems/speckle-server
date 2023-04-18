import { Optional, Roles } from '@speckle/shared'
import { fakeUsers } from '~~/components/form/select/Users.stories'
import {
  ActiveUserMainMetadataQuery,
  ActiveUserMainMetadataQueryVariables
} from '~~/lib/common/generated/gql/graphql'
import { apolloMockRequestWithDefaults } from '~~/lib/fake-nuxt-env/utils/betterMockLink'

const randomDate = new Date('01-01-2020')

export const mockActiveUserQuery = apolloMockRequestWithDefaults<
  ActiveUserMainMetadataQuery,
  ActiveUserMainMetadataQueryVariables,
  Optional<Partial<{ forceGuest: boolean }>>
>({
  request: ({ operationName }) => operationName === 'ActiveUserMainMetadata',
  result: (_, values) => ({
    data: {
      __typename: 'Query',
      activeUser: values?.forceGuest
        ? null
        : {
            __typename: 'User',
            id: 'random-logged-in-user',
            email: 'loggedin@user.com',
            name: 'Logged in user',
            role: Roles.Server.User,
            avatar: fakeUsers[0].avatar,
            isOnboardingFinished: false,
            createdAt: randomDate.toISOString(),
            verified: false
          }
    }
  })
})
